/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
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
import { Widget } from "@phosphor/widgets";
import { DisposableCollection, Emitter, Event } from "@theia/core";
import { WidgetFactory } from "@theia/core/lib/browser";
import { inject, injectable } from "inversify";

import { BinalyzerSymbolInformationNode } from "./binalyzer-bindings-view-widget";
import { BinalyzerViewWidget, BinalyzerViewWidgetFactory } from "./binalyzer-view-widget";


@injectable()
export class BinalyzerViewService implements WidgetFactory {

    id = 'binalyzer-view';

    protected widget?: BinalyzerViewWidget;
    protected readonly onDidChangeOpenStateEmitter = new Emitter<boolean>();
    protected readonly onDidChangeBindingEmitter = new Emitter<BinalyzerSymbolInformationNode[]>();
    protected readonly onDidSelectEmitter = new Emitter<BinalyzerSymbolInformationNode>();
    protected readonly onDidOpenEmitter = new Emitter<BinalyzerSymbolInformationNode>();
    constructor(@inject(BinalyzerViewWidgetFactory) protected factory: BinalyzerViewWidgetFactory) { }

    get onDidSelect(): Event<BinalyzerSymbolInformationNode> {
        return this.onDidSelectEmitter.event;
    }

    get onDidOpen(): Event<BinalyzerSymbolInformationNode> {
        return this.onDidOpenEmitter.event;
    }

    get onDidChangeBinding(): Event<BinalyzerSymbolInformationNode[]> {
        return this.onDidChangeBindingEmitter.event;
    }

    get onDidChangeOpenState(): Event<boolean> {
        return this.onDidChangeOpenStateEmitter.event;
    }

    get open(): boolean {
        return this.widget !== undefined && this.widget.isVisible;
    }

    /**
     * Publish the collection of outline view symbols.
     * - Publishing includes setting the `OutlineViewWidget` tree with symbol information.
     * @param roots the list of outline symbol information nodes.
     */
    publish(roots: BinalyzerSymbolInformationNode[]): void {
        if (this.widget) {
            this.widget.bindings.setBinalyzerTree(roots);
            this.onDidChangeBindingEmitter.fire(roots);
        }
    }

    createWidget(): Promise<Widget> {
        this.widget = this.factory();

        const firstNode = {
            id: 'Node0',
            name: 'Node0',
            visible: true,
            parent: undefined,
            children: [],
            busy: 0,
            iconClass: 'node0',
            selected: false,
            expanded: false
        } as BinalyzerSymbolInformationNode;

        const secondNode = {
            id: 'Node1',
            name: 'Node1',
            visible: true,
            parent: undefined,
            children: [],
            busy: 0,
            iconClass: 'node0',
            selected: false,
            expanded: false
        } as BinalyzerSymbolInformationNode;

        this.publish([firstNode, secondNode]);

        const disposables = new DisposableCollection();
        disposables.push(this.widget.bindings.onDidChangeOpenStateEmitter.event(open => this.onDidChangeOpenStateEmitter.fire(open)));
        disposables.push(this.widget.bindings.model.onOpenNode(node => this.onDidOpenEmitter.fire(node as BinalyzerSymbolInformationNode)));
        disposables.push(this.widget.bindings.model.onSelectionChanged(selection => this.onDidSelectEmitter.fire(selection[0] as BinalyzerSymbolInformationNode)));

        this.widget.disposed.connect(() => {
            this.widget = undefined;
            disposables.dispose();
        });
        return Promise.resolve(this.widget);
    }
}
