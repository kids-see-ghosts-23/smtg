import * as React from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    ConnectionMode,
    NodeTypes,
    Handle,
    Position,
    ReactFlowProvider,
    Node,
    Edge,
} from "reactflow";
import { toPng, toSvg } from "html-to-image";
import "reactflow/dist/style.css";

interface MindMapProps {
    summary: string;
}

// Define proper types for nodes and edges
interface CustomNodeData {
    label: string;
    type: "root" | "section" | "item";
}

type CustomEdge = Edge;

// Custom node component for the mindmap with improved styling
const CustomNodeComponent: React.FC<{
    data: CustomNodeData;
}> = ({ data }) => {
    const getNodeStyle = () => {
        switch (data.type) {
            case "root":
                return {
                    backgroundColor: "#3b82f6",
                    color: "white",
                    borderRadius: "50%",
                    width: "140px",
                    height: "140px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "bold",
                    textAlign: "center" as const,
                    border: "4px solid #1d4ed8",
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                    padding: "8px",
                };
            case "section":
                return {
                    backgroundColor: "#10b981",
                    color: "white",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    fontSize: "13px",
                    fontWeight: "600",
                    textAlign: "center" as const,
                    border: "3px solid #047857",
                    maxWidth: "220px",
                    minWidth: "160px",
                    boxShadow: "0 3px 10px rgba(16, 185, 129, 0.2)",
                    lineHeight: "1.3",
                };
            case "item":
                return {
                    backgroundColor: "#ffffff",
                    color: "#374151",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    fontSize: "12px",
                    border: "2px solid #e5e7eb",
                    maxWidth: "240px",
                    minWidth: "180px",
                    textAlign: "left" as const,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    lineHeight: "1.4",
                    wordWrap: "break-word" as const,
                };
        }
    };

    return (
        <div style={getNodeStyle()}>
            {/* Add handles for connections */}
            {data.type === "root" && (
                <>
                    <Handle
                        type="source"
                        position={Position.Top}
                        id="top"
                        style={{ background: "#1d4ed8", width: 8, height: 8 }}
                    />
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="bottom"
                        style={{ background: "#1d4ed8", width: 8, height: 8 }}
                    />
                    <Handle
                        type="source"
                        position={Position.Left}
                        id="left"
                        style={{ background: "#1d4ed8", width: 8, height: 8 }}
                    />
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="right"
                        style={{ background: "#1d4ed8", width: 8, height: 8 }}
                    />
                </>
            )}
            {data.type === "section" && (
                <>
                    <Handle
                        type="target"
                        position={Position.Top}
                        id="top"
                        style={{ background: "#047857", width: 6, height: 6 }}
                    />
                    <Handle
                        type="target"
                        position={Position.Bottom}
                        id="bottom"
                        style={{ background: "#047857", width: 6, height: 6 }}
                    />
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="left"
                        style={{ background: "#047857", width: 6, height: 6 }}
                    />
                    <Handle
                        type="target"
                        position={Position.Right}
                        id="right"
                        style={{ background: "#047857", width: 6, height: 6 }}
                    />
                    <Handle
                        type="source"
                        position={Position.Top}
                        id="source-top"
                        style={{ background: "#10b981", width: 6, height: 6 }}
                    />
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="source-bottom"
                        style={{ background: "#10b981", width: 6, height: 6 }}
                    />
                    <Handle
                        type="source"
                        position={Position.Left}
                        id="source-left"
                        style={{ background: "#10b981", width: 6, height: 6 }}
                    />
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="source-right"
                        style={{ background: "#10b981", width: 6, height: 6 }}
                    />
                </>
            )}
            {data.type === "item" && (
                <>
                    <Handle
                        type="target"
                        position={Position.Top}
                        id="top"
                        style={{ background: "#6b7280", width: 4, height: 4 }}
                    />
                    <Handle
                        type="target"
                        position={Position.Bottom}
                        id="bottom"
                        style={{ background: "#6b7280", width: 4, height: 4 }}
                    />
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="left"
                        style={{ background: "#6b7280", width: 4, height: 4 }}
                    />
                    <Handle
                        type="target"
                        position={Position.Right}
                        id="right"
                        style={{ background: "#6b7280", width: 4, height: 4 }}
                    />
                </>
            )}
            <div
                style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp:
                        data.type === "root"
                            ? 3
                            : data.type === "section"
                            ? 2
                            : 3,
                    WebkitBoxOrient: "vertical" as const,
                }}
            >
                {data.label}
            </div>
        </div>
    );
};

const nodeTypes: NodeTypes = {
    custom: CustomNodeComponent,
};

// Function to summarize content using OpenAI API
const summarizeWithOpenAI = async (content: string): Promise<string> => {
    try {
        // If content is short, return as is
        if (content.length <= 50) {
            return content;
        }

        const response = await fetch("/api/summarize-mindmap", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: content }),
        });

        if (!response.ok) {
            throw new Error("Failed to summarize content");
        }

        const data = await response.json();
        return data.summary || content.substring(0, 50);
    } catch (error) {
        console.error("OpenAI summarization failed:", error);
        // Fallback to manual summarization
        return content.length > 50 ? content.substring(0, 47) + "..." : content;
    }
};

export const MindMap = ({ summary }: MindMapProps) => {
    return (
        <ReactFlowProvider>
            <MindMapInner summary={summary} />
        </ReactFlowProvider>
    );
};

const MindMapInner = ({ summary }: MindMapProps) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdge>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [renderError, setRenderError] = React.useState<string | null>(null);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [downloadSuccess, setDownloadSuccess] = React.useState<string | null>(
        null
    );
    // Removed unused fitView variable

    // Helper function to determine the best connection points between two nodes
    const getBestConnectionHandles = React.useCallback(
        (
            sourcePos: { x: number; y: number },
            targetPos: { x: number; y: number }
        ) => {
            const deltaX = targetPos.x - sourcePos.x;
            const deltaY = targetPos.y - sourcePos.y;

            // Determine primary direction
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            if (absX > absY) {
                // Horizontal connection is dominant
                if (deltaX > 0) {
                    return { sourceHandle: "right", targetHandle: "left" };
                } else {
                    return { sourceHandle: "left", targetHandle: "right" };
                }
            } else {
                // Vertical connection is dominant
                if (deltaY > 0) {
                    return { sourceHandle: "bottom", targetHandle: "top" };
                } else {
                    return { sourceHandle: "top", targetHandle: "bottom" };
                }
            }
        },
        []
    );

    // Convert JSON data to React Flow nodes and edges with improved spacing
    const convertJSONToNodes = React.useCallback(
        async (data: Record<string, string | string[]>) => {
            const nodes: Node<CustomNodeData>[] = [];
            const edges: CustomEdge[] = [];

            // Create root node at center
            const rootNode: Node<CustomNodeData> = {
                id: "root",
                type: "custom",
                position: { x: 400, y: 300 },
                data: {
                    label: "Meeting Summary",
                    type: "root",
                },
                draggable: true,
            };
            nodes.push(rootNode);

            const sections = Object.keys(data);

            // Handle case where there are no sections
            if (sections.length === 0) {
                return { nodes, edges };
            }

            // Calculate optimal layout based on number of sections
            const rootX = 400;
            const rootY = 300;

            // Use different layout strategies based on section count
            let sectionPositions: { x: number; y: number }[] = [];

            if (sections.length <= 2) {
                // Horizontal layout for 1-2 sections
                sectionPositions = sections.map((_, index) => ({
                    x: rootX + (index === 0 ? -400 : 400),
                    y: rootY,
                }));
            } else if (sections.length <= 4) {
                // Quadrant layout for 3-4 sections
                const quadrants = [
                    { x: rootX - 350, y: rootY - 250 }, // Top-left
                    { x: rootX + 350, y: rootY - 250 }, // Top-right
                    { x: rootX - 350, y: rootY + 250 }, // Bottom-left
                    { x: rootX + 350, y: rootY + 250 }, // Bottom-right
                ];
                sectionPositions = sections.map((_, index) => quadrants[index]);
            } else {
                // Circular layout for 5+ sections with increased radius
                const sectionRadius = Math.max(400, 300 + sections.length * 20);
                const angleStep = (2 * Math.PI) / sections.length;
                sectionPositions = sections.map((_, index) => {
                    const angle = index * angleStep - Math.PI / 2; // Start from top
                    return {
                        x: rootX + Math.cos(angle) * sectionRadius,
                        y: rootY + Math.sin(angle) * sectionRadius,
                    };
                });
            }

            // Process sections and their content
            for (
                let sectionIndex = 0;
                sectionIndex < sections.length;
                sectionIndex++
            ) {
                const section = sections[sectionIndex];
                const sectionPos = sectionPositions[sectionIndex];
                const sectionId = `section-${sectionIndex}`;

                // Summarize section heading with OpenAI
                const sectionLabel = await summarizeWithOpenAI(section);

                // Create section node
                const sectionNode: Node<CustomNodeData> = {
                    id: sectionId,
                    type: "custom",
                    position: sectionPos,
                    data: {
                        label: sectionLabel,
                        type: "section",
                    },
                    draggable: true,
                };
                nodes.push(sectionNode);

                // Create edge from root to section
                const rootPos = { x: rootX, y: rootY };
                const { sourceHandle, targetHandle } = getBestConnectionHandles(
                    rootPos,
                    sectionPos
                );

                const rootToSectionEdge: CustomEdge = {
                    id: `root-${sectionId}`,
                    source: "root",
                    target: sectionId,
                    sourceHandle,
                    targetHandle,
                    type: "smoothstep",
                    style: { stroke: "#10b981", strokeWidth: 2 },
                    animated: false, // Reduce animation to improve clarity
                };
                edges.push(rootToSectionEdge);

                // Process section content
                const content = data[section];
                let items: string[] = [];

                if (typeof content === "string") {
                    items = [content];
                } else if (Array.isArray(content)) {
                    items = content;
                }

                // Limit items to prevent overcrowding
                const limitedItems = items.slice(0, 4); // Increased from 3 to 4

                // Skip item creation if no content
                if (limitedItems.length === 0) {
                    continue;
                }

                // Create item nodes with improved positioning
                const itemSpacing = 200; // Increased spacing between items
                const itemsPerRow = Math.ceil(Math.sqrt(limitedItems.length));

                for (
                    let itemIndex = 0;
                    itemIndex < limitedItems.length;
                    itemIndex++
                ) {
                    const item = limitedItems[itemIndex];
                    const itemSummary = await summarizeWithOpenAI(item);

                    // Calculate grid-based position relative to section
                    const row = Math.floor(itemIndex / itemsPerRow);
                    const col = itemIndex % itemsPerRow;
                    // Removed unused totalRows variable

                    // Determine direction from root to section for item placement
                    const sectionDirection = {
                        x: sectionPos.x - rootX,
                        y: sectionPos.y - rootY,
                    };
                    const sectionDistance = Math.sqrt(
                        sectionDirection.x ** 2 + sectionDirection.y ** 2
                    );

                    // Normalize direction
                    const normalizedDirection = {
                        x: sectionDirection.x / sectionDistance,
                        y: sectionDirection.y / sectionDistance,
                    };

                    // Create perpendicular vector for spreading items
                    const perpendicular = {
                        x: -normalizedDirection.y,
                        y: normalizedDirection.x,
                    };

                    // Calculate item position
                    const centerOffset = (itemsPerRow - 1) / 2;

                    const itemX =
                        sectionPos.x +
                        normalizedDirection.x * (180 + row * 80) +
                        (perpendicular.x * (col - centerOffset) * itemSpacing) /
                            2;

                    const itemY =
                        sectionPos.y +
                        normalizedDirection.y * (180 + row * 80) +
                        (perpendicular.y * (col - centerOffset) * itemSpacing) /
                            2;

                    const itemId = `item-${sectionIndex}-${itemIndex}`;

                    const itemNode: Node<CustomNodeData> = {
                        id: itemId,
                        type: "custom",
                        position: { x: itemX, y: itemY },
                        data: {
                            label: itemSummary,
                            type: "item",
                        },
                        draggable: true,
                    };
                    nodes.push(itemNode);

                    // Create edge from section to item
                    const itemPos = { x: itemX, y: itemY };
                    const {
                        sourceHandle: sectionSourceHandle,
                        targetHandle: itemTargetHandle,
                    } = getBestConnectionHandles(sectionPos, itemPos);

                    const sectionToItemEdge: CustomEdge = {
                        id: `${sectionId}-${itemId}`,
                        source: sectionId,
                        target: itemId,
                        sourceHandle: `source-${sectionSourceHandle}`,
                        targetHandle: itemTargetHandle,
                        type: "straight", // Changed from smoothstep to straight for clearer connections
                        style: {
                            stroke: "#9ca3af",
                            strokeWidth: 1.5,
                            strokeDasharray: "5,5", // Added dashed lines to differentiate levels
                        },
                        animated: false,
                    };
                    edges.push(sectionToItemEdge);
                }
            }

            return { nodes, edges };
        },
        [getBestConnectionHandles]
    );

    // Parse summary into JSON structure with headings as keys
    const parseSummaryToJSON = (
        summaryText: string
    ): Record<string, string | string[]> => {
        const lines = summaryText
            .split("\n")
            .filter((line) => line.trim() !== "");
        const result: Record<string, string | string[]> = {};

        let currentHeading = "";
        let currentContent: string[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Check for headings (### or ####)
            if (
                trimmedLine.startsWith("### ") ||
                trimmedLine.startsWith("#### ")
            ) {
                // Save previous section if it exists
                if (currentHeading && currentContent.length > 0) {
                    result[currentHeading] =
                        currentContent.length === 1
                            ? currentContent[0]
                            : currentContent;
                }

                // Start new section
                currentHeading = trimmedLine.replace(/^#+\s+/, "");
                currentContent = [];
            }
            // Check for list items
            else if (
                trimmedLine.startsWith("- ") ||
                trimmedLine.startsWith("* ")
            ) {
                const listItem = trimmedLine.substring(2).trim();
                if (listItem) {
                    currentContent.push(listItem);
                }
            }
            // Add other content
            else if (
                trimmedLine &&
                !trimmedLine.startsWith(">") &&
                !trimmedLine.startsWith("```")
            ) {
                if (currentHeading) {
                    currentContent.push(trimmedLine);
                }
            }
        }

        // Save the last section
        if (currentHeading && currentContent.length > 0) {
            result[currentHeading] =
                currentContent.length === 1
                    ? currentContent[0]
                    : currentContent;
        }

        return result;
    };

    // Main function to generate mindmap from summary (wrapped in useCallback)
    const generateMindMapFromSummary = React.useCallback(
        async (summaryText: string) => {
            setIsLoading(true);
            setRenderError(null);

            try {
                // Parse summary into JSON structure
                const jsonData = parseSummaryToJSON(summaryText);

                // Convert to nodes and edges with OpenAI summarization
                const { nodes: newNodes, edges: newEdges } =
                    await convertJSONToNodes(jsonData);

                // Update the flow
                setNodes(newNodes);
                setEdges(newEdges);
            } catch (error) {
                console.error("Error generating mindmap:", error);
                setRenderError("Failed to generate mind map from summary");
            } finally {
                setIsLoading(false);
            }
        },
        [setNodes, setEdges, convertJSONToNodes]
    );

    React.useEffect(() => {
        if (summary) {
            generateMindMapFromSummary(summary);
        }
    }, [summary, generateMindMapFromSummary]);

    // Download functions
    const downloadImage = async (format: "png" | "svg") => {
        if (nodes.length === 0) {
            setRenderError("No mindmap to download");
            return;
        }

        setIsDownloading(true);

        try {
            // Get the ReactFlow wrapper element which contains the full mindmap
            const reactFlowWrapper = document.querySelector(
                ".react-flow"
            ) as HTMLElement;

            if (!reactFlowWrapper) {
                throw new Error("ReactFlow element not found");
            }

            // Create filename with timestamp
            const timestamp = new Date()
                .toISOString()
                .replace(/[:.]/g, "-")
                .slice(0, -5);
            const fileName = `meeting-mindmap-${timestamp}`;

            const options = {
                backgroundColor: "#fafafa",
                pixelRatio: format === "png" ? 2 : 1,
                style: {
                    transform: "scale(1)",
                },
                filter: (node: Element) => {
                    // Filter out unwanted elements like controls and minimap
                    const classList = (node as HTMLElement).classList;
                    if (
                        classList?.contains("react-flow__controls") ||
                        classList?.contains("react-flow__minimap") ||
                        classList?.contains("react-flow__attribution")
                    ) {
                        return false;
                    }
                    return true;
                },
            };

            let dataUrl: string;

            if (format === "png") {
                dataUrl = await toPng(reactFlowWrapper, options);
            } else {
                dataUrl = await toSvg(reactFlowWrapper, options);
            }

            // Create and trigger download
            const link = document.createElement("a");
            link.download = `${fileName}.${format}`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clear any previous errors
            setRenderError(null);

            // Show success message
            setDownloadSuccess(
                `Downloaded ${format.toUpperCase()} successfully!`
            );
            setTimeout(() => setDownloadSuccess(null), 3000);
        } catch (error) {
            console.error("Error downloading image:", error);
            setRenderError(
                `Failed to download ${format.toUpperCase()}. Please try again.`
            );
        } finally {
            setIsDownloading(false);
        }
    };

    if (!summary) {
        return (
            <div className="bg-white rounded-lg border px-4 py-5">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
                    <div className="h-64 bg-gray-100 rounded" />
                </div>
            </div>
        );
    }

    if (summary.length === 0) {
        return (
            <div className="bg-white rounded-lg border px-4 py-5">
                <p className="text-gray-500">
                    No summary data available to generate mind map.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <p className="text-sm font-medium">Mind Map</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span>Summary</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Sections</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded"></div>
                            <span>Details</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                        Drag nodes to reorganize • Use controls to zoom & pan
                    </span>
                    <div className="flex items-center gap-1 border-l border-gray-200 pl-2 ml-2">
                        <span className="text-xs text-gray-400">Download:</span>
                        <button
                            onClick={() => downloadImage("png")}
                            disabled={
                                isLoading || isDownloading || nodes.length === 0
                            }
                            className="text-xs text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded border border-green-200 hover:bg-green-50 transition-colors flex items-center gap-1"
                            title="Download as PNG (High Resolution)"
                        >
                            {isDownloading ? (
                                <>
                                    <div className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                "PNG"
                            )}
                        </button>
                        <button
                            onClick={() => downloadImage("svg")}
                            disabled={
                                isLoading || isDownloading || nodes.length === 0
                            }
                            className="text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded border border-purple-200 hover:bg-purple-50 transition-colors"
                            title="Download as SVG (Vector Format)"
                        >
                            SVG
                        </button>
                        <div className="border-l border-gray-200 pl-2 ml-1">
                            <button
                                onClick={() =>
                                    generateMindMapFromSummary(summary)
                                }
                                disabled={isLoading}
                                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                                title="Regenerate mindmap"
                            >
                                {isLoading ? "Processing..." : "Refresh"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {renderError && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200 flex items-center gap-2">
                    <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    {renderError}
                </div>
            )}

            {downloadSuccess && (
                <div className="text-green-500 text-sm bg-green-50 p-2 rounded border border-green-200 flex items-center gap-2">
                    <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                    {downloadSuccess}
                </div>
            )}

            <div
                style={{ height: "600px", width: "100%" }}
                className="border rounded-lg overflow-hidden bg-gray-50"
            >
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    connectionMode={ConnectionMode.Loose}
                    fitView
                    fitViewOptions={{
                        padding: 100,
                        minZoom: 0.1,
                        maxZoom: 1.5,
                        includeHiddenNodes: false,
                    }}
                    minZoom={0.1}
                    maxZoom={2}
                    defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                    proOptions={{ hideAttribution: true }}
                    nodesDraggable={true}
                    nodesConnectable={false}
                    elementsSelectable={true}
                >
                    <Background
                        color="#e5e7eb"
                        gap={20}
                        size={1}
                        style={{ backgroundColor: "#fafafa" }}
                    />
                    <Controls
                        showZoom={true}
                        showFitView={true}
                        showInteractive={true}
                        position="bottom-right"
                    />
                    <MiniMap
                        nodeStrokeColor="#374151"
                        nodeColor={(node) => {
                            switch (node.data.type) {
                                case "root":
                                    return "#3b82f6";
                                case "section":
                                    return "#10b981";
                                case "item":
                                    return "#ffffff";
                                default:
                                    return "#f9fafb";
                            }
                        }}
                        nodeBorderRadius={8}
                        maskColor="rgba(255, 255, 255, 0.2)"
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            border: "1px solid #e5e7eb",
                        }}
                    />
                </ReactFlow>
            </div>
        </div>
    );
};
