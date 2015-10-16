'use strict';

var data = require('./git-branch-all.json')

function getAllBranches(res) {
    if (res) { res.type('json'); res.send(data); }
}

function getLogs(fragment, res) {
    var result = { error: 'branch name not found : ' + fragment };
    for (var i in data) {
        var item = data[i]
        if (item.branch.indexOf(fragment) != -1){
            result = item;
            result['q'] = fragment
            break;
        }
    }
    if (res) { res.type('json'); res.send(result); }
}

function getBranches(res) {
    var result = []
    for (var i in data) {
        var item = data[i]
        result.push(item.branch)
    }
    if (res) { res.type('json'); res.send(result); }

}

module.exports = {
    branches: getBranches,
    all: getAllBranches, 
    logs: getLogs
};