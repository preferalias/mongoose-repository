class BaseRepository {
  model: any = undefined;
  constructor(mongooseModel: any) {
    this.model = mongooseModel;
  }
  public async findOne(query: any, options: any): Promise<any> {
    let option = { ...options };
    let populate = option.populate;
    delete option.populate;
    if (populate && populate !== undefined && populate !== "") {
      if (typeof populate === 'string') {
        populate = JSON.parse(populate)
      }
      return this.model.findOne(query, option).populate(populate);
    } else {
      return this.model.findOne(query, option);
    }
  }
  public async find(query: any = {}, options: any = {}): Promise<any> {

    let page = {
      data: [],
      total: 0,
      limit: options.limit || 0,
      page: options.page || 1,
      hasNext: false
    };
    if (query) {
      if (typeof query === 'string') {
        query = JSON.parse(query)
      }
      // query = {name: 'd,dd,ddd'} => {name: ['d, 'dd', 'ddd']
      Object.keys(query).map(key => {
        if (typeof query[key] === "string") {
          query[key] = query[key].split(",");
        }
      })
    }
    if (options) {
      if (typeof options === 'string') {
        options = JSON.parse(options)
      }
      // options = {sort: '{"name": 1}"'}
      if (typeof options.sort === 'string') {
        options.sort = JSON.parse(options.sort)
      }

      if (typeof options.populate === 'string') {
        options.populate = JSON.parse(options.populate)
      }
    }

    if (
      this.model.paginate &&
      (options.page !== undefined && options.limit !== undefined)
    ) {
      if (options.page < 1) throw new Error("page start with 1");
      let result = null;
      if (
        options.populate &&
        options.populate !== undefined &&
        options.populate !== ""
      ) {
        result = await this.model.paginate(query, {
          limit: +options.limit,
          page: +options.page,
          sort: options.sort,
          populate: options.populate
        });
      } else {
        result = await this.model.paginate(query, {
          limit: +options.limit,
          page: +options.page,
          sort: options.sort
        });
      }
      page.data = result.docs;
      page.total = result.total;
      page.limit = result.limit;
      page.page = result.page;
      page.hasNext = result.page * result.limit < result.total;
      return page;
    } else {
      let result = null;
      if (
        options.populate &&
        options.populate !== undefined &&
        options.populate !== ""
      ) {
        result = await this.model.find(query).populate(options.populate);
      } else {
        result = await this.model.find(query);
      }
      page.data = result;
      page.total = result.length;
      return page;
    }
  }
  public async create(data: any): Promise<any> {
    return this.model.create(data);
  }
  public async update(query: any, data: any): Promise<any> {
    return this.model.findOneAndUpdate(query, data, { new: true });
  }
  public async upsert(query: any, data: any): Promise<any> {
    return this.model.findOneAndUpdate(query, data, {
      upsert: true,
      new: true
    });
  }
  public async delete(data: any): Promise<any> {
    return this.model.delete
      ? this.model.delete(data)
      : this.model.remove(data);
  }
}

export default BaseRepository
