'use strict';

// TODO : The gitPath should be externally configured, and reloadable 
var gitPath = '/home/rob/development/istock-vagrant/istock-src';

var exec = require('child_process').exec;
var execSync = require('child_process').execSync;

function getAllBranches(res) {

    var allBranchLogs = function(error, stdout, stderr) {
        // command output is in stdout
        var list = stdout.split("\n")
        var result = '['
        for(var i in list){
            var s = list[i].trim().split(' '),
            active = s.length != 1 && s[0] == '*',
            branch = (active) ? s[1] : s[0];
            // console.log(branch, (active ? ' [active]': ' -'))
            result += gitBranchLogs(branch);
        }
        result = result.slice(0, - 1)
        result += ']'
        // console.log(result)
        if (res) { res.type('json'); res.send(result); }
    };    
    gitBranchList(allBranchLogs)
}

function getBranchList(res) {
    var branchList = function(error, stdout, stderr) {
        // command output is in stdout
        var result = stdout.split("\n").slice(0, -1);
        // console.log(result)
        if (res) { res.type('json'); res.send(result); }
    };

    gitBranchList(branchList)
}

function getLogs(fragment, res) {
    var findBranch = function(search, list) {
        var result = '';
        for (var i = list.length - 1; i >= 0; i--) {
            var branch = list[i].trim()
            if (branch.indexOf(search) != -1) {
                console.log('each', branch)
                result = branch
                break;
            }
        };
        return result
    };
    var branchLogs = function(error, stdout, stderr) {
        var list = stdout.split("\n").slice(0, -1);
        var branch = findBranch(fragment, list);
        if (branch) {
            var result = gitBranchLogs(branch)
            res.send(result.trim());
        } else {
            res.send({ error: 'branch name not found...' });
        }
    }   
    res.type('json');
    gitBranchList(branchLogs)
}

function gitBranchList(callback, remote) {
    if (callback) {
        // var cmd = 'git branch' + ((remote || false) ? ' -a' : '')
        // remote = remote || false;
        // var flag = remote ? ' -a' : '';
        // var cmd = 'git branch';
        // exec(cmd + flag, { 
        exec('git branch' + ((remote || false) ? ' -a' : ''), { 
            cwd: gitPath, timeout: 0, encoding: 'utf8', 
            maxBuffer: 200*1024, killSignal: 'SIGTERM' }, 
            callback
        );
    }
}

function gitBranchLogs(branch) {
    // git log -n 10 --pretty=format:
    // -- short format JSON
    // {%n  "commit": "%H",%n  "author": "%an <%ae>",%n  "date": "%ad",%n  "message": "%f"%n},'
    // -- long format JSON
    //'{%n  "commit": "%H",%n  "abbreviated_commit": "%h",%n  "tree": "%T",%n  "abbreviated_tree": "%t",%n  "parent": "%P",%n  "abbreviated_parent": "%p",%n  "refs": "%D",%n  "encoding": "%e",%n  "subject": "%s",%n  "sanitized_subject_line": "%f",%n  "body": "%b",%n  "commit_notes": "%N",%n  "verification_flag": "%G?",%n  "signer": "%GS",%n  "signer_key": "%GK",%n  "author": {%n    "name": "%aN",%n    "email": "%aE",%n    "date": "%aD"%n  },%n  "commiter": {%n    "name": "%cN",%n    "email": "%cE",%n    "date": "%cD"%n  }%n},'

    var git = "git log -n 5 --pretty=format:'"
    var fmt = '{ "commit": "%H", %n "author": "%an <%ae>", %n "date": "%ad", %n "message": "%f" %n},'
    var cmd = git.concat(fmt, "' ", branch)

    var stdout = execSync(cmd, { cwd: gitPath, timeout: 0, 
        encoding: 'utf8', maxBuffer: 200*1024, killSignal: 'SIGTERM' })
    // console.log(branch, stdout)
    var commits = stdout.slice(0, - 1);
    var result = '{ '.concat('"branch" : "', branch, '", \n "commits" : [', commits, ']},');
    return result;
}

module.exports = {
    branches: getBranchList,
    all: getAllBranches, 
    logs: getLogs
};
