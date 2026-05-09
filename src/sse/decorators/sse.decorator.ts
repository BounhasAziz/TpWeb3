import { Get } from '@nestjs/common';

export const Sse = (path: string = 'stream') => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    Get(path)(target, propertyKey, descriptor);

    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const res = args.find(
        (arg) =>
          arg &&
          typeof arg.setHeader === 'function' &&
          typeof arg.write === 'function',
      );
      if (res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // flushHeaders exists on Express response; guard if absent
        if (typeof res.flushHeaders === 'function') {
          res.flushHeaders();
        }
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
};
