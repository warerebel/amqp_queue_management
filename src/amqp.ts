import container from "rhea";

const AMQP_CONN_HOST = process.env["AMQP_CONN_HOST"] || "";
const AMQP_CONN_PORT = process.env["AMQP_CONN_PORT"] || "";

const amqpConnection = container.connect({ port: parseInt(AMQP_CONN_PORT), host: AMQP_CONN_HOST, idle_time_out: 5000 });

const queues: {[key: string]: container.Sender} = {};

export function amqpSend(queueName: string, data: unknown): boolean{
    if(!queues[queueName])
        queues[queueName] = amqpConnection.open_sender(queueName);
    if(queues[queueName].sendable()){
        const delivery = queues[queueName].send({body: data}) as unknown as boolean;
        return delivery;
    }
    return false;
}

export function amqpSendable(queueName: string){
    return queues[queueName].sendable();
}
