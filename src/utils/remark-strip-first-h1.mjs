export default function remarkStripFirstH1() {
  return (tree) => {
    if (!tree || !Array.isArray(tree.children)) {
      return;
    }

    const firstH1Index = tree.children.findIndex(
      (node) => node?.type === 'heading' && node?.depth === 1,
    );

    if (firstH1Index !== -1) {
      tree.children.splice(firstH1Index, 1);
    }
  };
}
