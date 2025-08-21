const Counter = require("../models/counter.model");
class CounterRepository {
    async getNextSequence(name) {
        const counter = await Counter.findByIdAndUpdate(
          name,
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        return counter.seq;
      }
          
}

module.exports = CounterRepository;
