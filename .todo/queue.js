export default class Queue {

  constructor (initialSize = 1024*1024) {
    this.positions = new Uint8Array(initialSize)
  }

  /** If index >= this.length, double the size of the allocated array. */
  allocate (index) {
    if (index >= this.positions.length) {
      const positions = new Uint8Array(this.positions.length * 2)
      // Copy old values to new array
      for (let i = 0; i < this.positions.length; i++) {
        positions[i] = this.positions[i]
      }
      this.positions = positions
    }
  }

  /** Remove item from queue. */
  dequeue (index) {
    this.allocate(index)
    this.positions[index] = 0
  }

  /** Add item to queue.
    * @param index {number} index of item
    * @param force {boolean} enqueue even if completed (to reindex) */
  enqueue (index, force = false) {
    this.allocate(index)
    if (force || (this.positions[index] === 0)) {
      this.positions[index] = 1
    }
  }

  /** Mark item as processed. */
  complete (index) {
    this.allocate(index)
    this.positions[index] = 2
  }

  /** Mark item as failed. */
  failure (index) {
    this.allocate(index)
    this.positions[index] = 3
  }

  /** Return first item in queue with matching state */
  first (state = 1) {
    for (let i = 0; i < this.positions.length; i++) {
      if (this.positions[i] === state) return i
    }
    return null
  }

  /** Return last item in queue with matching state */
  last (state = 1) {
    for (let i = this.positions.length - 1; i >= 0; i--) {
      if (this.positions[i] === state) return i
    }
    return null
  }

}

