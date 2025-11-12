#!/usr/bin/env node

/**
 * Automatically generates CODE_STRUCTURE.md
 * Lists all source files with their classes/functions
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const OUTPUT_FILE = path.join(__dirname, '../CODE_STRUCTURE.md');

function getAllTsFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files.push(...getAllTsFiles(fullPath));
        } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

function extractExports(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const exports = [];
    
    for (const line of lines) {
        // Match: export class ClassName
        const classMatch = line.match(/^export\s+(abstract\s+)?class\s+(\w+)/);
        if (classMatch) {
            const isAbstract = classMatch[1] ? 'abstract ' : '';
            exports.push(`${isAbstract}class ${classMatch[2]}`);
            continue;
        }
        
        // Match: export interface InterfaceName
        const interfaceMatch = line.match(/^export\s+interface\s+(\w+)/);
        if (interfaceMatch) {
            exports.push(`interface ${interfaceMatch[1]}`);
            continue;
        }
        
        // Match: export type TypeName
        const typeMatch = line.match(/^export\s+type\s+(\w+)/);
        if (typeMatch) {
            exports.push(`type ${typeMatch[1]}`);
            continue;
        }
        
        // Match: export function functionName
        const functionMatch = line.match(/^export\s+function\s+(\w+)/);
        if (functionMatch) {
            exports.push(`function ${functionMatch[1]}`);
            continue;
        }
        
        // Match: export const CONSTANT_NAME
        const constMatch = line.match(/^export\s+const\s+(\w+)/);
        if (constMatch) {
            exports.push(`const ${constMatch[1]}`);
            continue;
        }
    }
    
    return exports;
}

function extractMethods(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const methods = [];
    let insideClass = false;
    let braceDepth = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Track class definition
        if (line.match(/^(export\s+)?(abstract\s+)?class\s+\w+/)) {
            insideClass = true;
            braceDepth = 0;
        }
        
        // Track braces
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        braceDepth += openBraces - closeBraces;
        
        if (insideClass && braceDepth > 0) {
            // Check if line starts a method signature - look for "static keyword(" pattern
            const staticMethodStart = line.match(/^\s+static\s+(\w+)\s*\(/);
            if (staticMethodStart) {
                // Collect lines until we find the opening brace
                let pendingSignature = line.trim();
                let j = i + 1;
                let foundClosing = false;
                while (j < lines.length && j < i + 15) {
                    const nextLine = lines[j].trim();
                    pendingSignature += ' ' + nextLine;
                    if (nextLine.includes('{') || nextLine.includes(';')) {
                        foundClosing = true;
                        i = j; // Skip past collected lines
                        break;
                    }
                    j++;
                }
                
                if (!foundClosing) {
                    i++; // Move to next line
                    continue;
                }
                
                // Parse method name and visibility
                const nameMatch = pendingSignature.match(/^\s*static\s+(?:(private|public)\s+)?(\w+)\s*\(/);
                if (!nameMatch || nameMatch[2] === 'constructor') continue;
                
                const visibility = nameMatch[1] || 'public';
                const name = nameMatch[2];
                
                // Extract return type: find ) and : then get everything until { or ;
                const returnTypeMatch = pendingSignature.match(/\)\s*:\s*(.+?)\s*[{;]/);
                if (returnTypeMatch) {
                    let returnType = returnTypeMatch[1].trim();
                    // Clean up return type - normalize whitespace
                    returnType = returnType.replace(/\s+/g, ' ');
                    // Cap length for readability
                    if (returnType.length > 80) {
                        returnType = returnType.substring(0, 77) + '...';
                    }
                    methods.push(`static ${visibility} ${name}(): ${returnType}`);
                }
            }
        }
        
        if (insideClass && braceDepth === 0 && line.includes('}')) {
            insideClass = false;
        }
    }
    
    return methods;
}

function generateMarkdown() {
    const files = getAllTsFiles(SRC_DIR).sort();
    
    let markdown = '# Code Structure\n\n';
    markdown += '*Auto-generated by `npm run generate-structure`*\n\n';
    markdown += '---\n\n';
    
    for (const filePath of files) {
        const relativePath = path.relative(path.join(__dirname, '..'), filePath);
        const exports = extractExports(filePath);
        const methods = extractMethods(filePath);
        
        markdown += `## ${relativePath}\n\n`;
        
        if (exports.length > 0) {
            markdown += '**Exports:**\n';
            for (const exp of exports) {
                markdown += `- ${exp}\n`;
            }
            markdown += '\n';
        }
        
        if (methods.length > 0) {
            markdown += '**Methods:**\n';
            for (const method of methods) {
                markdown += `- ${method}\n`;
            }
            markdown += '\n';
        }
        
        if (exports.length === 0 && methods.length === 0) {
            markdown += '*No exports*\n\n';
        }
        
        markdown += '---\n\n';
    }
    
    return markdown;
}

function main() {
    console.log('Generating code structure documentation...');
    const markdown = generateMarkdown();
    fs.writeFileSync(OUTPUT_FILE, markdown);
    console.log(`✓ Generated ${OUTPUT_FILE}`);
}

main();
