/********************************************************************************
 * Copyright (c) 2019-2020 EclipseSource and others.
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
import { getPort } from "@eclipse-glsp/protocol";
import { BaseBLSPServerContribution } from "@eclipse-glsp/theia-integration/lib/node";
import { injectable } from "inversify";
import * as net from "net";
import { createSocketConnection, IConnection } from "vscode-ws-jsonrpc/lib/server";

@injectable()
export class BinalyzerServerContribution extends BaseBLSPServerContribution {
    readonly id: string = "Workflow";
    readonly name: string = "Workflow";
    static readonly DEFAULT_PORT = 5000;
    static readonly PORT_ARG_KEY = "WF_BLSP";

    readonly description = {
        id: 'workflow',
        name: 'Workflow',
        documentSelector: ['workflow'],
        fileEvents: [
            '**/*.workflow'
        ]
    };

    start(clientConnection: IConnection): void {
        let socketPort = getPort(BinalyzerServerContribution.PORT_ARG_KEY);
        if (isNaN(socketPort)) {
            console.info(`No valid port argument was passed (--${BinalyzerServerContribution.PORT_ARG_KEY}=xxxx). Default port ${BinalyzerServerContribution.DEFAULT_PORT} is used.`);
            socketPort = BinalyzerServerContribution.DEFAULT_PORT;
        }

        const socket = new net.Socket();
        const serverConnection = createSocketConnection(socket, socket, () => {
            socket.destroy();
        });
        this.forward(clientConnection, serverConnection);
        socket.connect(socketPort);
    }
}
