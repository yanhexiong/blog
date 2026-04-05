import { visit } from "unist-util-visit";

function escapeHtml(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

export function remarkMermaid() {
	return (tree) => {
		visit(tree, "code", (node, index, parent) => {
			if (!parent || typeof index !== "number") return;
			if (node.lang !== "mermaid") return;

			const source = node.value || "";
			const encodedSource = encodeURIComponent(source);
			parent.children[index] = {
				type: "html",
				value: `<pre class="mermaid" data-mermaid-source="${encodedSource}" data-pagefind-ignore>${escapeHtml(source)}</pre>`,
			};
		});
	};
}
