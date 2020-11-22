/********************************************************************************
 * Copyright (C) 2018 Red Hat, Inc. and others.
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
import { Disposable } from "@theia/core";
import { ReactWidget } from "@theia/core/lib/browser/widgets";
import { inject, injectable, postConstruct } from "inversify";
import * as React from "react";

import { BinalyzerViewModel } from "./binalyzer-view-model";



@injectable()
export class BinalyzerToolBar extends ReactWidget {

    @inject(BinalyzerViewModel)
    protected readonly model: BinalyzerViewModel;

    @postConstruct()
    protected init(): void {
        this.id = 'binalyzer:toolbar:' + this.model.id;
        this.addClass('binalyzer-toolbar');
        this.toDispose.push(this.model);
        this.toDispose.push(this.model.onDidChange(() => this.update()));
        this.scrollOptions = undefined;
        this.update();
    }

    focus(): void {
        if (!this.doFocus()) {
            this.onRender.push(Disposable.create(() => this.doFocus()));
            this.update();
        }
    }
    protected doFocus(): boolean {
        return true;
    }

    protected render(): React.ReactNode {
        return <React.Fragment>
            {this.renderContinue()}
        </React.Fragment>;
    }

    protected renderContinue(): React.ReactNode {
        return <div />;
    }

}
