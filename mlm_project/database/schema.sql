-- ============================================================
-- NETWORK MARKETING COMPANY MANAGEMENT SYSTEM
-- MySQL Schema: Tables, Keys, Constraints, Trigger,
-- Stored Procedure, and View
-- ============================================================

DROP DATABASE IF EXISTS network_marketing_db;
CREATE DATABASE network_marketing_db;
USE network_marketing_db;

-- ---------------------------------------------------------------
-- 1. USER_ACC  (login credentials, shared by members & admins)
-- ---------------------------------------------------------------
CREATE TABLE USER_ACC (
    user_id     INT AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('admin','member') NOT NULL DEFAULT 'member',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- 2. RANK_MASTER  (distributor rank / level, e.g. Bronze, Silver, Gold)
-- ---------------------------------------------------------------
CREATE TABLE RANK_MASTER (
    rank_id           INT AUTO_INCREMENT PRIMARY KEY,
    rank_name         VARCHAR(50) NOT NULL UNIQUE,
    min_sales         DECIMAL(12,2) NOT NULL DEFAULT 0,
    commission_rate   DECIMAL(5,2)  NOT NULL DEFAULT 5.00 CHECK (commission_rate BETWEEN 0 AND 100)
);

-- ---------------------------------------------------------------
-- 3. MEMBER  (distributor; self-referencing sponsor_id builds the
--             downline / network tree)
-- ---------------------------------------------------------------
CREATE TABLE MEMBER (
    member_id    INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL UNIQUE,
    sponsor_id   INT NULL,
    rank_id      INT NOT NULL DEFAULT 1,
    name         VARCHAR(100) NOT NULL,
    address      VARCHAR(255),
    phone        VARCHAR(15),
    dob          DATE,
    join_date    DATE NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_member_user    FOREIGN KEY (user_id)    REFERENCES USER_ACC(user_id)      ON DELETE CASCADE,
    CONSTRAINT fk_member_sponsor FOREIGN KEY (sponsor_id) REFERENCES MEMBER(member_id)       ON DELETE SET NULL,
    CONSTRAINT fk_member_rank    FOREIGN KEY (rank_id)    REFERENCES RANK_MASTER(rank_id)    ON DELETE RESTRICT
);

-- ---------------------------------------------------------------
-- 4. PRODUCT  (catalogue sold by the company)
-- ---------------------------------------------------------------
CREATE TABLE PRODUCT (
    product_id  INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    category    VARCHAR(50),
    price       DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

-- ---------------------------------------------------------------
-- 5. ORDERS  (a purchase placed by a member)
-- ---------------------------------------------------------------
CREATE TABLE ORDERS (
    order_id      INT AUTO_INCREMENT PRIMARY KEY,
    member_id     INT NOT NULL,
    order_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
    status        ENUM('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
    CONSTRAINT fk_orders_member FOREIGN KEY (member_id) REFERENCES MEMBER(member_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 6. ORDER_ITEM  (line items of an order)
-- ---------------------------------------------------------------
CREATE TABLE ORDER_ITEM (
    order_item_id  INT AUTO_INCREMENT PRIMARY KEY,
    order_id       INT NOT NULL,
    product_id     INT NOT NULL,
    quantity       INT NOT NULL CHECK (quantity > 0),
    price          DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_item_order   FOREIGN KEY (order_id)   REFERENCES ORDERS(order_id)   ON DELETE CASCADE,
    CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------
-- 7. COMMISSION  (earnings credited to a sponsor when their
--                 downline places a completed order)
-- ---------------------------------------------------------------
CREATE TABLE COMMISSION (
    commission_id    INT AUTO_INCREMENT PRIMARY KEY,
    member_id        INT NOT NULL,           -- who earns it
    order_id         INT NOT NULL,           -- which order generated it
    level            INT NOT NULL DEFAULT 1, -- 1 = direct sponsor, 2 = up-line, ...
    amount           DECIMAL(10,2) NOT NULL,
    commission_date  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status           ENUM('pending','paid') NOT NULL DEFAULT 'pending',
    CONSTRAINT fk_comm_member FOREIGN KEY (member_id) REFERENCES MEMBER(member_id) ON DELETE CASCADE,
    CONSTRAINT fk_comm_order  FOREIGN KEY (order_id)  REFERENCES ORDERS(order_id)   ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- 8. PAYMENT  (payouts made to members)
-- ---------------------------------------------------------------
CREATE TABLE PAYMENT (
    payment_id      INT AUTO_INCREMENT PRIMARY KEY,
    member_id       INT NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    payment_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method  ENUM('bank_transfer','upi','cash','wallet') NOT NULL DEFAULT 'bank_transfer',
    payment_status  ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
    CONSTRAINT fk_payment_member FOREIGN KEY (member_id) REFERENCES MEMBER(member_id) ON DELETE CASCADE
);

-- =================================================================
-- TRIGGER: automatically credit the direct sponsor a commission
-- whenever one of their downline's orders is marked 'completed'
-- =================================================================
DELIMITER $$
CREATE TRIGGER trg_generate_sponsor_commission
AFTER UPDATE ON ORDERS
FOR EACH ROW
BEGIN
    DECLARE v_sponsor_id INT;
    DECLARE v_rate DECIMAL(5,2);

    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
        SELECT m.sponsor_id, r.commission_rate
          INTO v_sponsor_id, v_rate
          FROM MEMBER m
          JOIN RANK_MASTER r ON r.rank_id = m.rank_id
         WHERE m.member_id = NEW.member_id;

        IF v_sponsor_id IS NOT NULL THEN
            INSERT INTO COMMISSION (member_id, order_id, level, amount, status)
            VALUES (v_sponsor_id, NEW.order_id, 1,
                    ROUND(NEW.total_amount * v_rate / 100, 2), 'pending');
        END IF;
    END IF;
END$$
DELIMITER ;

-- =================================================================
-- STORED PROCEDURE: fetch the entire downline (recursive) of a
-- given member, along with how many levels deep each one is
-- =================================================================
DELIMITER $$
CREATE PROCEDURE sp_get_downline(IN in_member_id INT)
BEGIN
    WITH RECURSIVE downline AS (
        SELECT member_id, sponsor_id, name, 1 AS depth
          FROM MEMBER
         WHERE sponsor_id = in_member_id
        UNION ALL
        SELECT m.member_id, m.sponsor_id, m.name, d.depth + 1
          FROM MEMBER m
          JOIN downline d ON m.sponsor_id = d.member_id
    )
    SELECT * FROM downline ORDER BY depth, member_id;
END$$
DELIMITER ;

-- =================================================================
-- VIEW: sales & earnings summary per member
-- =================================================================
CREATE VIEW vw_member_sales_summary AS
SELECT
    m.member_id,
    m.name,
    r.rank_name,
    COUNT(DISTINCT o.order_id)                              AS total_orders,
    COALESCE(SUM(DISTINCT o.total_amount), 0)                AS total_purchase_value,
    COALESCE((SELECT SUM(c.amount) FROM COMMISSION c
               WHERE c.member_id = m.member_id), 0)          AS total_commission_earned
FROM MEMBER m
JOIN RANK_MASTER r ON r.rank_id = m.rank_id
LEFT JOIN ORDERS o ON o.member_id = m.member_id AND o.status = 'completed'
GROUP BY m.member_id, m.name, r.rank_name;

-- =================================================================
-- SEED DATA
-- =================================================================
INSERT INTO RANK_MASTER (rank_name, min_sales, commission_rate) VALUES
('Bronze', 0, 5.00), ('Silver', 25000, 8.00), ('Gold', 75000, 12.00), ('Platinum', 200000, 18.00);

INSERT INTO USER_ACC (email, password, role) VALUES
('admin@nmc.com', 'hashed_pwd_0', 'admin'),
('anita@nmc.com', 'hashed_pwd_1', 'member'),
('ravi@nmc.com',  'hashed_pwd_2', 'member'),
('sara@nmc.com',  'hashed_pwd_3', 'member');

INSERT INTO MEMBER (user_id, sponsor_id, rank_id, name, address, phone, dob) VALUES
(2, NULL, 3, 'Anita Rao',   'Bengaluru', '9900011111', '1990-04-12'),
(3, 1,    2, 'Ravi Kumar',  'Mysuru',    '9900022222', '1992-08-25'),
(4, 2,    1, 'Sara Fatima', 'Hassan',    '9900033333', '1995-01-30');

INSERT INTO PRODUCT (name, category, price, stock) VALUES
('Herbal Shampoo', 'Personal Care', 299.00, 500),
('Protein Powder',  'Wellness',      1499.00, 200),
('Skin Serum',      'Personal Care', 899.00, 300);

INSERT INTO ORDERS (member_id, total_amount, status) VALUES
(3, 1798.00, 'completed'),
(3, 899.00,  'pending');

INSERT INTO ORDER_ITEM (order_id, product_id, quantity, price) VALUES
(1, 2, 1, 1499.00), (1, 1, 1, 299.00),
(2, 3, 1, 899.00);
