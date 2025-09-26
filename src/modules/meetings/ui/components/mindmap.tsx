import { useState, useEffect, useRef } from "react";

interface MermaidType {
    initialize: (config: any) => void;
    render: (
        id: string,
        definition: string
    ) => Promise<{ svg: string; bindFunctions?: (element: Element) => void }>;
}

interface MindMapProps {
    summary: string;
}

export const MindMap = ({ summary }: MindMapProps) => {
    const mermaidRef = useRef<HTMLDivElement>(null);
    const [mermaid, setMermaid] = useState<MermaidType | null>(null);
    const [mermaidCode, setMermaidCode] = useState<string>("");
    const [renderError, setRenderError] = useState<string | null>(null);

    useEffect(() => {
        // Load mermaid dynamically on client side
        const loadMermaid = async () => {
            try {
                const mermaidModule = await import("mermaid");
                const mermaidInstance = mermaidModule.default;
                mermaidInstance.initialize({
                    startOnLoad: false,
                    theme: "default",
                    securityLevel: "loose",
                    mindmap: {
                        padding: 20,
                        useMaxWidth: true,
                    },
                    flowchart: {
                        htmlLabels: true,
                        curve: 'basis',
                        rankSpacing: 50,
                        nodeSpacing: 50,
                        padding: 15,
                    }
                });
                setMermaid(mermaidInstance);
            } catch (error) {
                console.error("Failed to load mermaid:", error);
                setRenderError("Failed to load mind map library");
            }
        };

        loadMermaid();
    }, []);

    useEffect(() => {
        if (summary && mermaid) {
            const mindmapCode = generateEnhancedMindMap(summary);
            setMermaidCode(mindmapCode);
        }
    }, [summary, mermaid]);

    useEffect(() => {
        if (mermaidCode && mermaidRef.current && mermaid) {
            renderMermaid();
        }
    }, [mermaidCode, mermaid]);

    const renderMermaid = async () => {
        if (!mermaidRef.current || !mermaid) return;

        try {
            setRenderError(null);
            mermaidRef.current.innerHTML = ''; // Clear previous content
            const { svg, bindFunctions } = await mermaid.render(
                `mermaid-summary-${Date.now()}`,
                mermaidCode
            );
            if (mermaidRef.current) {
                mermaidRef.current.innerHTML = svg;
                bindFunctions?.(mermaidRef.current);
            }
        } catch (error) {
            console.error("Mermaid rendering error:", error);
            setRenderError("Failed to render mind map. Please try again.");
        }
    };

    const generateEnhancedMindMap = (summaryText: string): string => {
        const meetingData = parseMeetingSummary(summaryText);
        
        // Use mindmap syntax for better visual representation
        let code = "mindmap\n";
        code += "  root((Meeting Summary))\n";
        
        // Add main branches for each category with content
        if (meetingData.participants.length > 0) {
            code += "    Participants\n";
            meetingData.participants.slice(0, 5).forEach(participant => {
                code += `      ${sanitizeForMermaid(participant)}\n`;
            });
        }
        
        if (meetingData.mainTopics.length > 0) {
            code += "    Main Topics\n";
            meetingData.mainTopics.slice(0, 5).forEach(topic => {
                code += `      ${sanitizeForMermaid(topic)}\n`;
            });
        }
        
        if (meetingData.decisions.length > 0) {
            code += "    Decisions\n";
            meetingData.decisions.slice(0, 4).forEach(decision => {
                code += `      ${sanitizeForMermaid(decision)}\n`;
            });
        }
        
        if (meetingData.actionItems.length > 0) {
            code += "    Action Items\n";
            meetingData.actionItems.slice(0, 4).forEach(action => {
                code += `      ${sanitizeForMermaid(action)}\n`;
            });
        }
        
        if (meetingData.nextSteps.length > 0) {
            code += "    Next Steps\n";
            meetingData.nextSteps.slice(0, 4).forEach(step => {
                code += `      ${sanitizeForMermaid(step)}\n`;
            });
        }
        
        if (meetingData.keyPoints.length > 0) {
            code += "    Key Points\n";
            meetingData.keyPoints.slice(0, 4).forEach(point => {
                code += `      ${sanitizeForMermaid(point)}\n`;
            });
        }

        // If mindmap doesn't work well, fall back to flowchart
        if (code.split('\n').length < 5) {
            return generateFlowchartFallback(meetingData);
        }
        
        return code;
    };

    const generateFlowchartFallback = (meetingData: any): string => {
        let code = "graph TD\n";
        code += '    A[Meeting Summary]\n';
        
        let nodeIndex = 0;
        const getNodeId = () => `N${nodeIndex++}`;
        
        // Create a more structured flowchart
        if (meetingData.mainTopics.length > 0) {
            const topicsId = getNodeId();
            code += `    A --> ${topicsId}[Topics Discussed]\n`;
            meetingData.mainTopics.slice(0, 3).forEach((topic: string) => {
                const topicId = getNodeId();
                code += `    ${topicsId} --> ${topicId}["${sanitizeForMermaid(topic, 40)}"]\n`;
            });
        }
        
        if (meetingData.decisions.length > 0) {
            const decisionsId = getNodeId();
            code += `    A --> ${decisionsId}[Key Decisions]\n`;
            meetingData.decisions.slice(0, 3).forEach((decision: string) => {
                const decisionId = getNodeId();
                code += `    ${decisionsId} --> ${decisionId}["${sanitizeForMermaid(decision, 40)}"]\n`;
            });
        }
        
        if (meetingData.actionItems.length > 0) {
            const actionsId = getNodeId();
            code += `    A --> ${actionsId}[Action Items]\n`;
            meetingData.actionItems.slice(0, 3).forEach((action: string) => {
                const actionId = getNodeId();
                code += `    ${actionsId} --> ${actionId}["${sanitizeForMermaid(action, 40)}"]\n`;
            });
        }
        
        if (meetingData.nextSteps.length > 0) {
            const nextId = getNodeId();
            code += `    A --> ${nextId}[Next Steps]\n`;
            meetingData.nextSteps.slice(0, 3).forEach((step: string) => {
                const stepId = getNodeId();
                code += `    ${nextId} --> ${stepId}["${sanitizeForMermaid(step, 40)}"]\n`;
            });
        }
        
        return code;
    };

    const parseMeetingSummary = (text: string) => {
        // Clean the text first
        const cleanText = text
            .replace(/\[\d+:\d+\]/g, '') // Remove timestamps like [06:30]
            .replace(/\(\d+:\d+\)/g, '') // Remove timestamps like (06:30)
            .replace(/\d+:\d+/g, '') // Remove plain timestamps
            .replace(/^\s*[-•*]\s*/gm, '') // Remove bullet points
            .trim();

        const result = {
            participants: [] as string[],
            mainTopics: [] as string[],
            decisions: [] as string[],
            actionItems: [] as string[],
            nextSteps: [] as string[],
            keyPoints: [] as string[],
        };

        // Split into sentences for better parsing
        const sentences = cleanText
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10 && s.length < 200);

        // Extract participants (names mentioned)
        const namePattern = /\b([A-Z][a-z]+ (?:[A-Z][a-z]+ )?)/g;
        const names = new Set<string>();
        sentences.forEach(sentence => {
            const matches = sentence.match(namePattern);
            if (matches) {
                matches.forEach(name => {
                    // Filter out common words that might be capitalized
                    if (!['The', 'This', 'That', 'These', 'Those', 'We', 'They', 'It'].includes(name.trim())) {
                        names.add(name.trim());
                    }
                });
            }
        });
        result.participants = Array.from(names).slice(0, 5);

        // Extract content based on keywords and patterns
        sentences.forEach(sentence => {
            const lower = sentence.toLowerCase();
            
            // Skip sentences that look like technical logs or timestamps
            if (lower.includes('connection') || 
                lower.includes('checks the') || 
                lower.includes('asks about the') ||
                /^\d/.test(sentence)) {
                return;
            }

            // Decisions and agreements
            if (lower.includes('decided') || 
                lower.includes('agreed') || 
                lower.includes('concluded') ||
                lower.includes('determined') ||
                lower.includes('resolved')) {
                result.decisions.push(extractMeaningfulPart(sentence));
            }
            
            // Action items and tasks
            else if (lower.includes('will') || 
                     lower.includes('need to') || 
                     lower.includes('should') ||
                     lower.includes('must') ||
                     lower.includes('action item') ||
                     lower.includes('task') ||
                     lower.includes('todo')) {
                result.actionItems.push(extractMeaningfulPart(sentence));
            }
            
            // Next steps and future plans
            else if (lower.includes('next step') || 
                     lower.includes('follow up') || 
                     lower.includes('plan to') ||
                     lower.includes('upcoming') ||
                     lower.includes('schedule')) {
                result.nextSteps.push(extractMeaningfulPart(sentence));
            }
            
            // Main discussion topics
            else if (lower.includes('discussed') || 
                     lower.includes('talked about') || 
                     lower.includes('covered') ||
                     lower.includes('reviewed') ||
                     lower.includes('presented') ||
                     lower.includes('topic')) {
                result.mainTopics.push(extractMeaningfulPart(sentence));
            }
            
            // Key points and important information
            else if (lower.includes('important') || 
                     lower.includes('key') || 
                     lower.includes('main') ||
                     lower.includes('critical') ||
                     lower.includes('essential') ||
                     sentence.length > 20) {
                result.keyPoints.push(extractMeaningfulPart(sentence));
            }
        });

        // If we didn't extract enough structured data, extract general key points
        if (result.mainTopics.length === 0 && result.decisions.length === 0 && result.actionItems.length === 0) {
            // Extract the most meaningful sentences
            const meaningfulSentences = sentences
                .filter(s => !s.toLowerCase().includes('connection') && 
                           !s.toLowerCase().includes('checks') &&
                           s.length > 20)
                .slice(0, 8);
            
            // Distribute sentences into categories
            meaningfulSentences.forEach((sentence, index) => {
                if (index < 3) result.mainTopics.push(sentence);
                else if (index < 5) result.keyPoints.push(sentence);
                else result.actionItems.push(sentence);
            });
        }

        return result;
    };

    const extractMeaningfulPart = (sentence: string): string => {
        // Remove common phrase prefixes to get to the meat of the content
        const prefixPatterns = [
            /^(The team |We |They |It was |The meeting |Everyone |Participants? )/i,
            /^(discussed |agreed |decided |talked about |covered |reviewed )/i,
            /^(that |to |on |about )/i,
        ];
        
        let clean = sentence;
        prefixPatterns.forEach(pattern => {
            clean = clean.replace(pattern, '');
        });
        
        // Capitalize first letter
        clean = clean.charAt(0).toUpperCase() + clean.slice(1);
        
        return clean;
    };

    const sanitizeForMermaid = (text: string, maxLength: number = 30): string => {
        return text
            .replace(/["\[\](){}]/g, '') // Remove characters that break mermaid
            .replace(/[:\n]/g, ' ') // Replace colons and newlines
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
            .substring(0, maxLength)
            .replace(/\s+$/, '') // Remove trailing spaces
            + (text.length > maxLength ? '...' : '');
    };

    if (!summary || !mermaid) {
        return (
            <div className="bg-white rounded-lg border px-4 py-5">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (summary.length === 0) {
        return (
            <div className="bg-white rounded-lg border px-4 py-5">
                <p className="text-gray-500">No summary data available to generate mind map.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full">
            <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Visual Summary</p>
                <button 
                    onClick={() => {
                        const newCode = generateEnhancedMindMap(summary);
                        setMermaidCode(newCode);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                >
                    Refresh
                </button>
            </div>
            {renderError && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{renderError}</div>
            )}
            <div
                ref={mermaidRef}
                className="mermaid overflow-auto p-4 bg-gray-50 rounded"
                style={{ minHeight: "400px", maxHeight: "600px" }}
            >
                {!mermaidCode && "Generating visual summary..."}
            </div>
        </div>
    );
};