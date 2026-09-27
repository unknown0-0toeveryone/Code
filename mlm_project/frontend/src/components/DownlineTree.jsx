// Renders a flat [{ member_id, sponsor_id, name, depth }] list (from
// sp_get_downline) as a nested tree, purely by grouping on sponsor_id.
export default function DownlineTree({ rootId, rows }) {
  const children = (parentId) => rows.filter(r => r.sponsor_id === parentId);

  function renderNode(node) {
    const kids = children(node.member_id);
    return (
      <div className="tree-node" key={node.member_id}>
        <strong>{node.name}</strong> <span style={{ color: '#888' }}>(Level {node.depth})</span>
        {kids.map(renderNode)}
      </div>
    );
  }

  const directs = children(rootId);
  if (directs.length === 0) return <p>No downline members yet — start inviting people you sponsor!</p>;
  return <div>{directs.map(renderNode)}</div>;
}
