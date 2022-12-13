import {amqpSend, amqpSendable} from "./amqp";

/* istanbul ignore next */
const checkInterval = process.env["CHECK_INTERVAL"] || "1000";

const queues: {[key: string]: Array<unknown>} = {};

export function sendToQueue(queueName: string, data: unknown){
    const sent = amqpSend(queueName, data);
    if(!sent){
        if(!queues[queueName])
            queues[queueName] = [];
        queues[queueName].push(data);
    }
}

function checkQueues(){
    for(const key in queues){
        if(queues[key].length > 0 && amqpSendable(key)){
            let sent = false;
            do {
                const data = queues[key].shift();
                sent = amqpSend(key, data);
                if(!sent)
                    queues[key].push(data);
            } while(sent && queues[key].length > 0 && amqpSendable(key));
        }
    }
}

setInterval(checkQueues, parseInt(checkInterval)).unref();
