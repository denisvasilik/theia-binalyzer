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

import { injectable, inject } from 'inversify';
import { Event, Emitter, DisposableCollection } from '@theia/core';
import { WidgetFactory } from '@theia/core/lib/browser';
import { Widget } from '@phosphor/widgets';
import { BinalyzerSessionWidget, BinalyzerSessionWidgetFactory } from './binalyzer-session-widget';

@injectable()
export class BinalyzerViewService implements WidgetFactory {

    id = 'binalyzer-view';

    protected widget?: BinalyzerSessionWidget;
    protected readonly onDidChangeOpenStateEmitter = new Emitter<boolean>();

    constructor(@inject(BinalyzerSessionWidgetFactory) protected factory: BinalyzerSessionWidgetFactory) { }

    get onDidChangeOpenState(): Event<boolean> {
        return this.onDidChangeOpenStateEmitter.event;
    }

    get open(): boolean {
        return this.widget !== undefined && this.widget.isVisible;
    }

    createWidget(): Promise<Widget> {
        this.widget = this.factory();
        const disposables = new DisposableCollection();
        this.widget.disposed.connect(() => {
            this.widget = undefined;
            disposables.dispose();
        });
        return Promise.resolve(this.widget);
    }
}
