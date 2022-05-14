import { copyArr } from '@digitalbranch/u'
import Emitter from '@digitalbranch/emitter'

const _private = new WeakMap()

export default class Dispatcher extends Emitter {
  constructor (...args) {
    super()

    let self = this
    _private.set(self, {
      args: args,
      events: {}
    })

    if (args.length > 0) {
      args.forEach(o => self.addEvent(o.event, o.callback))
    }

    this.dispatch = function(e) {
      let target = e.target
      let currentTarget = e.currentTarget
      let actions = [e.type]
      let { events } = _private.get(self)

      if (target && target.getAttribute && target.dataset.action) {
        actions = target.dataset.action.split(',')
      } else if (currentTarget && currentTarget.getAttribute && currentTarget.dataset.action) {
        actions = currentTarget.dataset.action.split(',')
        target = currentTarget
      }

      actions.forEach(event => {
        if (events[event] && events.hasOwnProperty(event)) {
          events[event].forEach(listener => {
            try {
              listener.apply(self, [e, target, event])
              if (listener.once) {
                self.removeListener(event, listener)
              }
            } catch (err) {
              if (events.error && events.hasOwnProperty('error')) {
                self.dispatch({
                  type: 'error',
                  err: err,
                  target: self
                })
              } else {
                console.log(err)
              }
            }
          })
          return true
        } else {
          return false
        }
      })
    }
  }

  once (event, listener) {
    listener.once = true

    return this.addEvent(event, listener)
  }

  removeListener (event, listener) {
    let events = _private.get(this).events

    if (events[event] !== undefined) {
      events[event] = events[event].filter(fn => fn !== listener)
    }

    return this
  }

  listeners (event) {
    let events = _private.get(this).events
    let listeners = null

    if (events[event] !== undefined) {
      listeners = copyArr(events[event])
    }

    return listeners
  }

  addEvents (...args) {
    let self = this

    if (args.length > 0) {
      args.forEach(o => self.addEvent(o.event, o.callback))
    }

    return this
  }

  addEvent (event, listener) {
    let { events } = _private.get(this)

    if (typeof listener !== 'function') {
      throw new TypeError(listener + ' is not a function')
    }

    if (events[event] === undefined) {
      events[event] = [listener]
    } else if (events[event].every(fn => fn !== listener)) {
      events[event].push(listener)
    }

    return this
  }

  removeEvent (type) {
    let events = _private.get(this).events

    delete events[type]

    return this
  }
}
