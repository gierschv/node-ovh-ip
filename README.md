# node-ovh-ip

A really quickly written UI to manage the OVH network firewall.

**This module is unofficial and consequently not maintained by OVH.**

## Setup

[Node.js](http://nodejs.org/) is required to run this application.

```bash
$ npm install node-ovh-ip && cd node_modules/node-ovh-ip
```

Edit the configuration file `config/default.yaml`:

```yaml
app:
  # This string is used by the web server (connect) to compute
  # the session hash (http://www.senchalabs.org/connect/middleware-session.html).
  sessSecret: myRandomString
  # The base URL of the application. It will be used to redirect
  # the user after the authentication on OVH.com.
  baseUrl: http://localhost:3000
ovh:
  # You can create an application on OVH.com:
  # https://www.ovh.com/fr/cgi-bin/api/createApplication.cgi
  appKey: 42424242
  appSecret: 424242
```

Run the application:

```bash
$ npm start
```

## Screenshots

![IP status](https://raw.github.com/gierschv/node-ovh-ip/master/public/images/screens/fw-status.png)

![Rules editions](https://raw.github.com/gierschv/node-ovh-ip/master/public/images/screens/fw-rules.png)

## License

This module is freely distributable under the terms of the MIT license.

```
Copyright (c) 2013 Vincent Giersch <mail@vincent.sh>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
