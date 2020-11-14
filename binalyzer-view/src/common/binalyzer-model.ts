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
import { Disposable } from "@theia/core/lib/common/disposable";
import { IJSONSchema, IJSONSchemaSnippet } from "@theia/core/lib/common/json-schema";
import { WebSocketChannel } from "@theia/core/lib/common/messaging/web-socket-channel";
import { MaybePromise } from "@theia/core/lib/common/types";
import * as stream from "stream";

import { BinalyzerConfiguration } from "./binalyzer-configuration";


/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Some entities copied and modified from https://github.com/Microsoft/vscode/blob/master/src/vs/vscode.d.ts
// Some entities copied and modified from https://github.com/Microsoft/vscode/blob/master/src/vs/workbench/parts/binalyzer/common/binalyzer.ts

// FIXME: break down this file to binalyzer adapter and binalyzer adapter contribution (see Theia file naming conventions)

/**
 * BinalyzerAdapterSession symbol for DI.
 */
export const BinalyzerAdapterSession = Symbol('BinalyzerAdapterSession');

/**
 * The binalyzer adapter session.
 */
export interface BinalyzerAdapterSession {
    id: string;
    start(channel: WebSocketChannel): Promise<void>
    stop(): Promise<void>
}

/**
 * BinalyzerAdapterSessionFactory symbol for DI.
 */
export const BinalyzerAdapterSessionFactory = Symbol('BinalyzerAdapterSessionFactory');

/**
 * The [binalyzer session](#BinalyzerSession) factory.
 */
export interface BinalyzerAdapterSessionFactory {
    get(sessionId: string, communicationProvider: CommunicationProvider): BinalyzerAdapterSession;
}

/**
 * Binalyzer adapter executable for spawning.
 */
export interface BinalyzerAdapterSpawnExecutable {
    command: string;
    args?: string[];
}

/**
 * Binalyzer adapter executable for forking.
 */
export interface BinalyzerAdapterForkExecutable {
    modulePath: string;
    execArgv?: string[];
    args?: string[];
}

/**
 * Binalyzer adapter executable.
 * Parameters to instantiate the binalyzer adapter.
 *
 * In case of launching adapter the parameters contain a command and arguments. For instance:
 * {'command' : 'COMMAND_TO_LAUNCH_DEBUG_ADAPTER', args : [ { 'arg1', 'arg2' } ] }
 *
 * In case of forking the node process, contain the modulePath to fork. For instance:
 * {'modulePath' : 'NODE_COMMAND_TO_LAUNCH_DEBUG_ADAPTER', args : [ { 'arg1', 'arg2' } ] }
 */
export type BinalyzerAdapterExecutable = BinalyzerAdapterSpawnExecutable | BinalyzerAdapterForkExecutable;

/**
 * Provides some way we can communicate with the running binalyzer adapter. In general there is
 * no obligation as of how to launch/initialize local or remote binalyzer adapter
 * process/server, it can be done separately and it is not required that this interface covers the
 * procedure, however it is also not disallowed.
 *
 * TODO: the better name is BinalyzerStreamConnection + handling on error and close
 */
export interface CommunicationProvider extends Disposable {
    output: stream.Readable;
    input: stream.Writable;
}

/**
 * BinalyzerAdapterFactory symbol for DI.
 */
export const BinalyzerAdapterFactory = Symbol('BinalyzerAdapterFactory');

/**
 * Factory to start binalyzer adapter.
 */
export interface BinalyzerAdapterFactory {
    start(executable: BinalyzerAdapterExecutable): CommunicationProvider;
    connect(binalyzerServerPort: number): CommunicationProvider;
}

/**
 * BinalyzerAdapterContribution symbol for DI.
 */
export const BinalyzerAdapterContribution = Symbol('BinalyzerAdapterContribution');

/**
 * A contribution point for binalyzer adapters.
 */
export interface BinalyzerAdapterContribution {
    /**
     * The binalyzer type. Should be a unique value among all binalyzer adapters.
     */
    readonly type: string;

    readonly label?: MaybePromise<string | undefined>;

    readonly languages?: MaybePromise<string[] | undefined>;

    /**
     * The [binalyzer adapter session](#BinalyzerAdapterSession) factory.
     * If a default implementation of the binalyzer adapter session does not
     * fit all needs it is possible to provide its own implementation using
     * this factory. But it is strongly recommended to extend the default
     * implementation if so.
     */
    binalyzerAdapterSessionFactory?: BinalyzerAdapterSessionFactory;

    /**
     * @returns The contributed configuration schema for this binalyzer type.
     */
    getSchemaAttributes?(): MaybePromise<IJSONSchema[]>;

    getConfigurationSnippets?(): MaybePromise<IJSONSchemaSnippet[]>;

    /**
     * Provides a [binalyzer adapter executable](#BinalyzerAdapterExecutable)
     * based on [binalyzer configuration](#BinalyzerConfiguration) to launch a new binalyzer adapter
     * or to connect to existed one.
     * @param config The resolved [binalyzer configuration](#BinalyzerConfiguration).
     * @returns The [binalyzer adapter executable](#BinalyzerAdapterExecutable).
     */
    provideBinalyzerAdapterExecutable?(config: BinalyzerConfiguration): MaybePromise<BinalyzerAdapterExecutable | undefined>;

    /**
     * Provides initial [binalyzer configuration](#BinalyzerConfiguration).
     * @returns An array of [binalyzer configurations](#BinalyzerConfiguration).
     */
    provideBinalyzerConfigurations?(workspaceFolderUri?: string): MaybePromise<BinalyzerConfiguration[]>;

    /**
     * Resolves a [binalyzer configuration](#BinalyzerConfiguration) by filling in missing values
     * or by adding/changing/removing attributes before variable substitution.
     * @param config The [binalyzer configuration](#BinalyzerConfiguration) to resolve.
     * @returns The resolved binalyzer configuration.
     */
    resolveBinalyzerConfiguration?(config: BinalyzerConfiguration, workspaceFolderUri?: string): MaybePromise<BinalyzerConfiguration | undefined>;

    /**
     * Resolves a [binalyzer configuration](#BinalyzerConfiguration) by filling in missing values
     * or by adding/changing/removing attributes with substituted variables.
     * @param config The [binalyzer configuration](#BinalyzerConfiguration) to resolve.
     * @returns The resolved binalyzer configuration.
     */
    resolveBinalyzerConfigurationWithSubstitutedVariables?(config: BinalyzerConfiguration, workspaceFolderUri?: string): MaybePromise<BinalyzerConfiguration | undefined>;
}
