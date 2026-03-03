import {EventEmitter, SafeEventEmitter} from './event-emitter';

describe('EventEmitter', () => {
    it('should emit an event without listeners', () => {
        const emitter = new EventEmitter();
        emitter.emit('event', null);
    });

    it('should emit an event for one listener', () => {
        const eventObj = {flag: false};
        const listener = jest.fn();
        const emitter = new EventEmitter();
        emitter.on('event0', listener);
        emitter.emit('event0', eventObj);
        expect(listener).toBeCalledTimes(1);
        expect(listener).toBeCalledWith(eventObj);
    });

    it('should emit event for multiple listeners', () => {
        const eventObj = {test: 1};
        const listener0 = jest.fn();
        const listener1 = jest.fn();
        const emitter = new EventEmitter();
        emitter.on('event', listener0);
        emitter.on('event', listener1);
        emitter.emit('event', eventObj);
        expect(listener0).toBeCalledTimes(1);
        expect(listener1).toBeCalledTimes(1);
        expect(listener0).toBeCalledWith(eventObj);
        expect(listener1).toBeCalledWith(eventObj);
    });

    it('should emit an event only for listeners subscribed to this type of event', () => {
        const listener0 = jest.fn();
        const listener1 = jest.fn();
        const emitter = new EventEmitter();
        emitter.on('event0', listener0);
        emitter.on('event1', listener1);
        emitter.emit('event0', null);
        expect(listener0).toBeCalled();
        expect(listener1).not.toBeCalled();
    });

    it('should remove listeners', () => {
        const listener = jest.fn();
        const emitter = new EventEmitter();
        emitter.on('event', listener);
        emitter.off('event', listener);
        emitter.emit('event', null);
        expect(listener).not.toBeCalled();
    });

    it('safe emitter should catch errors in listeners', () => {
        const onError = jest.fn();
        const emitter = new SafeEventEmitter({onError});
        emitter.on('event', () => {
            throw new Error('test error');
        });
        emitter.emit('event', {});
        expect(onError).toBeCalledWith(new Error('test error'));
    });
});
