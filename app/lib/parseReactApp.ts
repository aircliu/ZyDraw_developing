export interface ParsedFile {
    path: string;
    content: string;
  }
  
  export interface ParsedReactApp {
    files: ParsedFile[];
  }
  
  export function parseReactApp(content: string): ParsedReactApp | null {
    const reactAppMatch = content.match(/<reactapp>([\s\S]*?)<\/reactapp>/);
    if (!reactAppMatch) return null;
  
    const appContent = reactAppMatch[1];
    const files: ParsedFile[] = [];
    
    // Parse files
    const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
    let match;
    
    while ((match = fileRegex.exec(appContent)) !== null) {
      files.push({
        path: match[1],
        content: match[2].trim()
      });
    }
  
    return { files };
  }