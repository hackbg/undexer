export class Queue {

  constructor (initialSize = 1024*1024) {
    this.positions = new Uint8Array(initialSize)
  }

  /** Add item to queue, reallocating if necessary. */
  add (index) {
    // If we've run out of space, allocate twice as much
    if (index >= this.positions.length) {
      const positions = new Uint8Array(this.positions.length * 2)
      // Copy old values to new array
      for (let i = 0; i < this.positions.length; i++) {
        positions[i] = this.positions[i]
      }
      this.positions = positions
    }
    // Mark presence of item at position
    this.positions[index] = 1
  }

  /** Remove item from queue. */
  remove (index) {
    this.positions[index] = 0
  }

  /** Return first item in queue. */
  first () {
    for (let i = 0; i < this.positions.length; i++) {
      if (this.positions[i] > 0) return i
    }
    return null
  }

  /** Return and remove first item from queue */
  popFirst () {
    const i = this.first()
    if (i !== null) this.remove(i)
    return i
  }

  /** Return last item in queue. */
  last () {
    for (let i = this.positions.length - 1; i >= 0; i--) {
      if (this.positions[i] > 0) return i
    }
    return null
  }

  /** Return and remove last item from queue */
  popLast () {
    const i = this.last()
    if (i !== null) this.remove(i)
    return i
  }

}

