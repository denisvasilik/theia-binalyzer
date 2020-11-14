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
import { TaskIdentifier } from "@theia/task/lib/common";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type BinalyzerViewLocation = 'default' | 'left' | 'right' | 'bottom';

/**
 * Configuration for a binalyzer adapter session.
 */
export interface BinalyzerConfiguration {
    /**
     * The type of the binalyzer adapter session.
     */
    type: string;

    /**
     * The name of the binalyzer adapter session.
     */
    name: string;

    /**
     * Additional binalyzer type specific properties.
     */
    [key: string]: any;

    /**
     * The request type of the binalyzer adapter session.
     */
    request: string;

    /**
     * If noBinalyzer is true the launch request should launch the program without enabling binalyzerging.
     */
    noBinalyzer?: boolean;

    /**
     * Optional data from the previous, restarted session.
     * The data is sent as the 'restart' attribute of the 'terminated' event.
     * The client should leave the data intact.
     */
    __restart?: any;

    /** default: default */
    binalyzerViewLocation?: BinalyzerViewLocation

    /** default: neverOpen */
    openBinalyzer?: 'neverOpen' | 'openOnSessionStart' | 'openOnFirstSessionStart' | 'openOnBinalyzerBreak';

    /** default: neverOpen */
    internalConsoleOptions?: 'neverOpen' | 'openOnSessionStart' | 'openOnFirstSessionStart'

    /** Task to run before binalyzer session starts */
    preLaunchTask?: string | TaskIdentifier;

    /** Task to run after binalyzer session ends */
    postBinalyzerTask?: string | TaskIdentifier;
}
export namespace BinalyzerConfiguration {
    export function is(arg: BinalyzerConfiguration | any): arg is BinalyzerConfiguration {
        return !!arg && typeof arg === 'object' && 'type' in arg && 'name' in arg && 'request' in arg;
    }
}
