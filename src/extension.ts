'use strict';
import * as vscode from 'vscode';
import { setInterval } from 'timers';

let rateChecker: BitCoinRateChecker;
let statusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);
let brand = ["BTC", "ETH", "ETC", "DAO", "LSK", "FCT", "XMR", "REP", "XRP", "ZEC", "XEM", "LTC", "DASH", "BCH"];
var currentBrand = "BTC";
var hide = false;
var requestOptions = {
    url: "https://coincheck.com/api/rate/"+currentBrand+"_jpy/",
    headers: {
        'User-Agent': 'request'
    }
};

function setupRateChecker(context: vscode.ExtensionContext) : BitCoinRateChecker {
    if (!rateChecker)
        rateChecker = new BitCoinRateChecker(context, 'extension.needMoreSushi');
    return rateChecker;
}

function selectBrand(context: vscode.ExtensionContext) {
    var options: vscode.QuickPickOptions = {　placeHolder: "What command do you use?"　};
    brand.push(hide ? "SHOW" : "HIDE");
    vscode.window.showQuickPick(brand, options).then((selectedBrand)=>{
        brand.pop();
        if (selectedBrand == undefined) { return; }
        if (selectedBrand == "HIDE") {
            hide = true;
        } else if (selectedBrand == "SHOW") {
            hide = false;
        } else {
            currentBrand = selectedBrand;
            requestOptions.url = "https://coincheck.com/api/rate/"+currentBrand+"_jpy/";
        }
        rateChecker.requestRate();
    });
}

export function activate(context: vscode.ExtensionContext) {

    interface Commands {
        id: string;
        command: (context: vscode.ExtensionContext) => any;
    }
    let commands: Commands[] = [
        {
            id: 'extension.sayCoinRate',
            command: () => setupRateChecker(context)
        },
        {
            id: 'extension.selectBrand',
            command: () => selectBrand(context)
        }
    ];

    commands.forEach(cmd => {
        context.subscriptions.push(vscode.commands.registerCommand(cmd.id, cmd.command));
    });
}

export function deactivate() {
    if (rateChecker) {
        rateChecker.dispose();
        rateChecker = null;
    }
}

export class BitCoinRateChecker extends vscode.Disposable {
    private timer: NodeJS.Timer;
    public rate;
    private 

    constructor(context: vscode.ExtensionContext, command: string)
    {
        super(() => {this.close()});
        statusBarItem = statusBarItem;


       this.requestRate();
        this.timer = setInterval(()=>{
            this.requestRate();
        }, 10000);
    }

    public requestRate()
    {
        let request = require('request');
        request.get(requestOptions, this.callback);
    }

    callback(error, response, body) {
        if (error) {
            console.log('Error: ' + error.message);
            return;
        }
        let json = JSON.parse(body);
        this.rate = String(Math.round(json.rate*1000)/1000);
        if (statusBarItem != null) {
            if (hide){
                statusBarItem.text = currentBrand+"/YEN"
                statusBarItem.tooltip = this.rate.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') + " "+currentBrand+"/YEN";
            }else {
                statusBarItem.text = this.rate.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') + " "+currentBrand+"/YEN";
            }
            statusBarItem.show();
            statusBarItem.command = 'extension.selectBrand';
        }
    }

    private close() : void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}