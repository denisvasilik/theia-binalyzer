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

export type BinalyzerViewWidgetFactory = () => BinalyzerBindingsViewWidget;
export const BinalyzerViewWidgetFactory = Symbol('BinalyzerViewWidgetFactory');

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
        this.title.label = 'Binalyzer';
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

    protected renderTree(model: TreeModel): React.ReactNode {
        if (CompositeTreeNode.is(this.model.root) && !this.model.root.children.length) {
            return <div className='theia-widget-noInfo no-outline'>No outline information available.</div>;
        }
        return super.renderTree(model);
    }
}
