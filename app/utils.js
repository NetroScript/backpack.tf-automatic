const axios = require('axios');
const querystring = require('querystring');
const Prompt = require('prompt');
require('colors');

// Set up prompt
Prompt.message = Prompt.delimiter = "";

exports.getJSON = function (opts) {
    let o = {};

    if (opts.qs) {
        o.params = opts.qs;
    }

    return axios.get(opts.url, o).then((resp) => {
        if (opts.checkResponse && !resp.data.response && !resp.data.response.success) {
            throw resp;
        }
        return [resp.data, resp.data.response];
    }).catch((resp) => {
        let r = resp.response || {};
        throw [resp.message || ("HTTP error " + r.status), r.status, r.data];
    });
};

exports.postJSON = function (opts, _json) {
    let o = {};

    if (_json === false) {
        o.data = querystring.stringify(opts.form);
    } else if (opts.form) o.data = opts.form;
	
	//console.log(o)
	//console.log(opts.url)
	
    return axios.post(opts.url, o.data).then((resp) => {
		//console.log(resp)
        return [resp.data, resp.data.response, resp.status];
    }).catch((resp) => {
        let r = resp.response || {};
        throw [resp.message || ("HTTP error " + r.status), r.status, r.data];
    });
};

exports.postForm = (opts) => exports.postJSON(opts, false);

exports.prompt = (props) => {
    return new Promise((resolve, reject) => {
        Prompt.start();
        Prompt.get({properties: props}, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

exports.fatal = (log, msg) => {
    log.error(msg);
    process.exit(1);
};

exports.after = {
    timeout(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    },
    seconds(s) {
        return this.timeout(1000 * s);
    },
    minutes(m) {
        return this.timeout(1000 * 60 * m);
    }
};