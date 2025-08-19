/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
 */

const http = require('node:http');
const { styleText } = require('node:util');
const express = require('express');
const compression = require('compression');
const util = require('./cordova-util');

class CreateExpressApp {
    constructor() {
        this.app = express();

        // Attach this before anything else to provide status output
        this.app.use((req, res, next) => {
            res.on('finish', function () {
                const statusCode = styleText(
                    this.statusCode === 404 ? 'red' : 'green',
                    `${this.statusCode}`
                );

                let msg = `${statusCode} ${this.req.originalUrl}`;

                const encoding = this.getHeader('content-encoding');
                if (encoding) {
                    msg += styleText('gray', ` (${encoding})`);
                }
                console.log(msg);
            });
            next();
        });

        this.app.use(compression());
    }

    launchServer(platform, opts) {
        this.port = opts.port || 8000;
        this.projectRoot = util.findProjectRoot(opts.root);
        this.root = util.getPlatformWwwRoot(this.projectRoot, platform);

        return new Promise((resolve, reject) => {
            this.server = http.Server(this.app);

            if (opts.router) {
                this.app.use(opts.router);
            }

            if (this.root) {
                this.app.use(express.static(this.root));
            }

            const listener = this.server.listen(this.port);

            listener.on('listening', () => {
                const message = `Static file server running on: ${styleText('green', `http://localhost:${this.port}`)} (CTRL + C to shut down)`;
                console.log(message);
                resolve(message);
            });
            listener.on('error', e => {
                if (e && e.toString().indexOf('EADDRINUSE') > -1) {
                    this.port++;
                    this.server.listen(this.port);
                } else {
                    reject(e);
                }
            });
        });
    }
}

module.exports = function () {
    return new CreateExpressApp();
};