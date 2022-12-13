process.env["CHECK_INTERVAL"] = "10";
import * as assert from "assert";
import * as sinon from "sinon";
import container, { Connection } from "rhea";
// Stub amqp comms with sinon
const containerStub = sinon.stub(container);
const firstSendableStub = sinon.stub().returns(false);
const firstSendStub = sinon.stub().returns(false);
const secondSendableStub = sinon.stub().returns(false);
const secondSendStub = sinon.stub().returns(false);
const openSenderStub = sinon.stub().onFirstCall().returns({sendable: firstSendableStub, send: firstSendStub});
const amqpConnectionStub = {open_sender: openSenderStub};
containerStub.connect.returns(amqpConnectionStub as unknown as Connection);
// Finished stubbing
import {sendToQueue} from "../src/queue";

describe("amqp_queue_management test suite", function(){

    it("adds items to the queue whilst queue is unsendable, items are sent when queue is sendable", function(done) {
        sinon.resetHistory();
        firstSendStub.returns(false);
        firstSendableStub.returns(false);
        sendToQueue("testOne", "test data");
        sendToQueue("testOne", "test data two");
        assert.deepStrictEqual(firstSendStub.callCount, 0);
        firstSendStub.returns(true);
        firstSendableStub.returns(true);
        setTimeout(function() {
            assert.deepStrictEqual(firstSendStub.callCount, 2);
            assert.deepStrictEqual(firstSendStub.args[0][0], {body: "test data"});
            assert.deepStrictEqual(firstSendStub.args[1][0], {body: "test data two"});
            done();
        }, 40);
    });

    it("adds items to multiple queues", function(done) {
        sinon.resetHistory();
        openSenderStub.resetBehavior();
        openSenderStub.returns({sendable: secondSendableStub, send: secondSendStub});
        firstSendStub.returns(false);
        firstSendableStub.returns(false);
        sendToQueue("testOne", "test data");
        sendToQueue("testTwo", "test data two");
        assert.deepStrictEqual(firstSendStub.callCount, 0);
        assert.deepStrictEqual(secondSendStub.callCount, 0);
        firstSendStub.returns(true);
        firstSendableStub.returns(true);
        secondSendStub.returns(true);
        secondSendableStub.returns(true);
        setTimeout(function() {
            assert.deepStrictEqual(firstSendStub.callCount, 1);
            assert.deepStrictEqual(secondSendStub.callCount, 1);
            assert.deepStrictEqual(firstSendStub.args[0][0], {body: "test data"});
            assert.deepStrictEqual(secondSendStub.args[0][0], {body: "test data two"});
            done();
        }, 40);
    });

    it("pushes items back to queue if send is not successful", function(done){
        sinon.resetHistory();
        firstSendStub.returns(false);
        firstSendableStub.returns(false);
        sendToQueue("testOne", "test data two");
        assert.deepStrictEqual(firstSendStub.callCount, 0);
        firstSendableStub.returns(true);
        setTimeout(function() {
            assert.deepStrictEqual(firstSendStub.callCount, 1);
            firstSendStub.returns(true);
        }, 10);
        setTimeout(function() {
            assert.deepStrictEqual(firstSendStub.callCount, 2);
            assert.deepStrictEqual(firstSendStub.args[0][0], {body: "test data two"});
            assert.deepStrictEqual(firstSendStub.args[1][0], {body: "test data two"});
            done();
        }, 40);
    });

    it("sends data without using queue if credit is available on the line", function(){
        sinon.resetHistory();
        firstSendStub.returns(true);
        firstSendableStub.returns(true);
        sendToQueue("testOne", "test data");
        sendToQueue("testOne", "test data two");
        assert.deepStrictEqual(firstSendStub.callCount, 2);
    });

});