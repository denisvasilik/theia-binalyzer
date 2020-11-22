/********************************************************************************
 * Copyright (C) 2019 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { bindContributionProvider, Emitter } from "@theia/core";
import {
    CompositeTreeNode,
    ContextMenuRenderer,
    createTreeContainer,
    defaultTreeProps,
    ExpandableTreeNode,
    Message,
    NodeProps,
    SelectableTreeNode,
    TreeDecoratorService,
    TreeModel,
    TreeModelImpl,
    TreeNode,
    TreeProps,
    TreeWidget
} from "@theia/core/lib/browser";
import { Container, inject, injectable, interfaces } from "inversify";
import * as React from "react";

import { BindingsViewTreeModel } from "./binalyzer-bindings-view-tree";
import { BinalyzerDecoratorService, BinalyzerTreeDecorator } from "./binalyzer-decorator-service";

/**
 * Representation of an outline symbol information node.
 */
export interface BinalyzerSymbolInformationNode extends CompositeTreeNode, SelectableTreeNode, ExpandableTreeNode {
    /**
     * The `iconClass` for the given tree node.
     */
    iconClass: string;
}

/**
 * Collection of outline symbol information node functions.
 */
export namespace BinalyzerSymbolInformationNode {
    /**
     * Determine if the given tree node is an `BinalyzerSymbolInformationNode`.
     * - The tree node is an `BinalyzerSymbolInformationNode` if:
     *  - The node exists.
     *  - The node is selectable.
     *  - The node contains a defined `iconClass` property.
     * @param node the tree node.
     *
     * @returns `true` if the given node is an `BinalyzerSymbolInformationNode`.
     */
    export function is(node: TreeNode): node is BinalyzerSymbolInformationNode {
        return !!node && SelectableTreeNode.is(node) && 'iconClass' in node;
    }
}

export type BinalyzerBindingsViewWidgetFactory = () => BinalyzerBindingsViewWidget;
export const BinalyzerBindingsViewWidgetFactory = Symbol('BinalyzerBindingsViewWidgetFactory');

@injectable()
export class BinalyzerBindingsViewWidget extends TreeWidget {

    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>();

    constructor(
        @inject(TreeProps) protected readonly treeProps: TreeProps,
        @inject(BindingsViewTreeModel) model: BindingsViewTreeModel,
        @inject(ContextMenuRenderer) protected readonly contextMenuRenderer: ContextMenuRenderer
    ) {
        super(treeProps, model, contextMenuRenderer);
        this.id = 'binalyzer-bindings-view';
        this.title.label = 'Binalyzer Label';
        this.title.caption = 'Binalyzer Caption';
        this.title.closable = true;
        this.addClass('theia-binalyzer-bindings-view');
    }

    static createContainer(parent: interfaces.Container): Container {
        const child = createTreeContainer(parent);
        child.parent = parent;

        child.rebind(TreeProps).toConstantValue({ ...defaultTreeProps, search: true });

        child.unbind(TreeWidget);
        child.bind(BinalyzerBindingsViewWidget).toSelf();

        child.unbind(TreeModelImpl);
        child.bind(BindingsViewTreeModel).toSelf();
        child.rebind(TreeModel).toService(BindingsViewTreeModel);

        child.bind(BinalyzerDecoratorService).toSelf().inSingletonScope();
        child.rebind(TreeDecoratorService).toDynamicValue(ctx => ctx.container.get(BinalyzerDecoratorService)).inSingletonScope();
        bindContributionProvider(child, BinalyzerTreeDecorator);

        return child;
    }

    static createWidget(parent: interfaces.Container): BinalyzerBindingsViewWidget {
        return BinalyzerBindingsViewWidget.createContainer(parent).get(BinalyzerBindingsViewWidget);
    }

    /**
     * Set the outline tree with the list of `BinalyzerSymbolInformationNode`.
     * @param roots the list of `BinalyzerSymbolInformationNode`.
     */
    public setBinalyzerTree(roots: BinalyzerSymbolInformationNode[]): void {
        this.model.root = {
            id: 'binalyzer-bindings-view-root',
            name: 'Binalyzer Root',
            visible: false,
            children: roots,
            parent: undefined
        } as CompositeTreeNode;
    }

    /**
     * Reconcile the outline tree state, gathering all available nodes.
     * @param nodes the list of `TreeNode`.
     *
     * @returns the list of tree nodes.
     */
    protected reconcileTreeState(nodes: TreeNode[]): TreeNode[] {
        nodes.forEach(node => {
            if (BinalyzerSymbolInformationNode.is(node)) {
                const treeNode = this.model.getNode(node.id);
                if (treeNode && BinalyzerSymbolInformationNode.is(treeNode)) {
                    treeNode.expanded = node.expanded;
                    treeNode.selected = node.selected;
                }
                this.reconcileTreeState(Array.from(node.children));
            }
        });
        return nodes;
    }

    protected onAfterHide(msg: Message): void {
        super.onAfterHide(msg);
        this.onDidChangeOpenStateEmitter.fire(false);
    }

    protected onAfterShow(msg: Message): void {
        super.onAfterShow(msg);
        this.onDidChangeOpenStateEmitter.fire(true);
    }

    renderIcon(node: TreeNode, props: NodeProps): React.ReactNode {
        if (BinalyzerSymbolInformationNode.is(node)) {
            return <div className={'symbol-icon symbol-icon-center ' + node.iconClass}></div>;
        }
        return undefined;
    }

    protected createNodeAttributes(node: TreeNode, props: NodeProps): React.Attributes & React.HTMLAttributes<HTMLElement> {
        const elementAttrs = super.createNodeAttributes(node, props);
        return {
            ...elementAttrs,
            title: this.getNodeTooltip(node)
        };
    }

    /**
     * Get the tooltip for the given tree node.
     * - The tooltip is discovered when hovering over a tree node.
     * - If available, the tooltip is the concatenation of the node name, and it's type.
     * @param node the tree node.
     *
     * @returns the tooltip for the tree node if available, else `undefined`.
     */
    protected getNodeTooltip(node: TreeNode): string | undefined {
        if (BinalyzerSymbolInformationNode.is(node)) {
            return node.name + ` (${node.iconClass})`;
        }
        return undefined;
    }

    protected isExpandable(node: TreeNode): node is ExpandableTreeNode {
        return BinalyzerSymbolInformationNode.is(node) && node.children.length > 0;
    }

    protected renderTree(model: TreeModel): React.ReactNode {
        if (CompositeTreeNode.is(this.model.root) && !this.model.root.children.length) {
            return <div className='theia-widget-noInfo no-outline'>No binding information available.</div>;
        }
        return super.renderTree(model);
    }
}
