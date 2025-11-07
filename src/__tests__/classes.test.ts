import { Node } from '../core/Node';
import { Edge } from '../core/Edge';
import { HyperEdge } from '../core/HyperEdge';
import { Module } from '../core/Module';

describe('Node', () => {
    it('should create a node with basic properties', () => {
        const node = new Node('test_node', { layer: 0 });
        expect(node.id).toBe('test_node');
        expect(node.layer).toBe(0);
        expect(node.visible).toBe(true);
        expect(node.implicit).toBe(false);
    });

    it('should mark implicit nodes correctly', () => {
        const node = new Node('implicit', { implicit: true });
        expect(node.implicit).toBe(true);
    });

    it('should handle selection', () => {
        const node = new Node('test');
        node.select();
        expect(node.selected).toBe(true);
        node.deselect();
        expect(node.selected).toBe(false);
    });

    it('should update attributes', () => {
        const node = new Node('test', { colour: '#ff0000' });
        expect(node.attributes.colour).toBe('#ff0000');
        node.updateAttribute('colour', '#00ff00');
        expect(node.attributes.colour).toBe('#00ff00');
    });

    it('should clamp opacity to 0-1', () => {
        const node = new Node('test');
        node.setOpacity(1.5);
        expect(node.alpha).toBe(1);
        node.setOpacity(-0.5);
        expect(node.alpha).toBe(0);
    });

    it('should calculate visibility based on zoom level', () => {
        const node = new Node('test', { layer: 1 });
        const vis = node.getVisibility(1);
        expect(vis).toBe(1); // Full visibility at its layer
        const vis2 = node.getVisibility(0);
        expect(vis2).toBeLessThan(1); // Reduced visibility at different layer
    });
});

describe('Edge', () => {
    it('should create an edge between two nodes', () => {
        const n1 = new Node('a');
        const n2 = new Node('b');
        const edge = new Edge('edge1', n1, n2, { colour: '#ff0000' });
        expect(edge.source).toBe(n1);
        expect(edge.target).toBe(n2);
        expect(edge.attributes.colour).toBe('#ff0000');
    });

    it('should hide an edge', () => {
        const n1 = new Node('a');
        const n2 = new Node('b');
        const edge = new Edge('edge1', n1, n2);
        edge.hidden = true;
        expect(edge.hidden).toBe(true);
    });
});

describe('HyperEdge', () => {
    it('should create a hyperedge with multiple sources and targets', () => {
        const n1 = new Node('a');
        const n2 = new Node('b');
        const n3 = new Node('c');
        const he = new HyperEdge('he1', [n1, n2], [n3]);
        expect(he.sources.length).toBe(2);
        expect(he.targets.length).toBe(1);
    });

    it('should filter out implicit nodes from hyperedge', () => {
        const n1 = new Node('a');
        const n2 = new Node('b', { implicit: true });
        const n3 = new Node('c');
        const he = new HyperEdge('he1', [n1, n2], [n3]);
        expect(he.sources.length).toBe(1);
        expect(he.sources[0]).toBe(n1);
    });

    it('should summarize hyperedge with new nodes', () => {
        const n1 = new Node('a');
        const n2 = new Node('b');
        const n3 = new Node('c');
        const n4 = new Node('d');
        const he = new HyperEdge('he1', [n1], [n2]);
        he.summarize([n3], [n4]);
        expect(he.sources[0]).toBe(n3);
        expect(he.targets[0]).toBe(n4);
    });
});

describe('Module', () => {
    it('should create a module with child nodes', () => {
        const n1 = new Node('a', { layer: 0 });
        const n2 = new Node('b', { layer: 0 });
        const module = new Module('mod1', { children: [n1, n2], layer: 1 });
        expect(module.children.length).toBe(2);
        expect(module.layer).toBe(1);
        expect(module.collapsed).toBe(false);
    });

    it('should collapse and expand modules', () => {
        const n1 = new Node('a');
        const module = new Module('mod1', { children: [n1] });
        module.collapse();
        expect(module.collapsed).toBe(true);
        expect(n1.visible).toBe(false);
        module.expand();
        expect(module.collapsed).toBe(false);
        expect(n1.visible).toBe(true);
    });

    it('should get visible children, excluding implicit ones', () => {
        const n1 = new Node('a');
        const n2 = new Node('b', { implicit: true });
        const module = new Module('mod1', { children: [n1, n2] });
        const visible = module.getVisibleChildren();
        expect(visible.length).toBe(1);
        expect(visible[0]).toBe(n1);
    });

    it('should set layer for all child nodes', () => {
        const n1 = new Node('a', { layer: 0 });
        const n2 = new Node('b', { layer: 0 });
        const module = new Module('mod1', { children: [n1, n2], layer: 1 });
        module.setLayer(2);
        expect(module.layer).toBe(2);
        expect(n1.layer).toBe(2);
        expect(n2.layer).toBe(2);
    });
});
