const { RECORD_PER_PAGE, RESPONSE, STATUS_CODE } = require('../shared/constant');
const { isEmpty, omit, cloneDeep, assign } = require('lodash');
const queryString = require('querystring');

module.exports.getData = async (req, res, modelInstance) => {
  const pageParam = req.query.page;
  const recordPerPageParam = req.query.item_per_page;
  const currentPage = (isNaN(pageParam) || pageParam <= 0 || !pageParam) ? 1 : parseInt(pageParam);
  const recordPerPage = (isNaN(recordPerPageParam) || recordPerPageParam <= 0 || !recordPerPageParam) ? RECORD_PER_PAGE : parseInt(recordPerPageParam);
  const self = this;

  try {
    const paginationResult = await getPaginationData(req, res, currentPage, recordPerPage, modelInstance);
    if (isEmpty(paginationResult)) {
      // recursion when current page is exceed with total pages
      self.getData(req, res, modelInstance);
    } else {
      return Promise.resolve(paginationResult);
    }
  } catch (err) {
    return Promise.reject(err);
  }
}

async function getPaginationData(req, res, currentPage, recordPerPage, modelInstance) {
  let indexPage = (currentPage - 1) > 0 ? (currentPage - 1) : 0;

  let skip = recordPerPage * indexPage;

  // Clone query obj
  let requestQuery = cloneDeep(req.query);
  const dbQuery = modelInstance.searchQuery(req);

  try {
    let countItems = await modelInstance.countAllItems();

    if (countItems <= 0) {
      return Promise.resolve({
        result: 0,
        code: 'NO_ITEMS',
      }); 
    }

    let paginationResult = await modelInstance.getPaginationData(recordPerPage, skip, dbQuery);

    if (isEmpty(paginationResult.result)) {
        return Promise.resolve({
            result: 0,
            code: 'NOT_FOUND',
        });     
    }

    const { result: { totalItems } } = paginationResult;
    paginationResult = assign({}, { ...paginationResult.result });
    let totalPages, prevPage, nextPage;
    totalPages = Math.ceil(totalItems / recordPerPage);
    paginationResult.totalPages = totalPages;

    if (currentPage > totalPages) {
      req.query.page = totalPages;
      // recursion
      return Promise.resolve(null);
    }

    if (currentPage >= 1) {
      prevPage = currentPage - 1;
      if (prevPage < 1 || currentPage > totalPages) {
        paginationResult.prevPage = null;
      } else if (prevPage >= 1 && prevPage <= totalPages) {
        paginationResult.prevPage = prevPage;
      }
    }

    if (currentPage < totalPages) {
      nextPage = currentPage + 1;
      paginationResult.nextPage = nextPage;
    } else if (currentPage >= totalPages) {
      paginationResult.nextPage = null;
    }

    delete requestQuery.page;
    assign(paginationResult, {
      currentPage,
      query: {
        params: requestQuery,
        searchString: !isEmpty(requestQuery) ? `?${queryString.stringify(requestQuery)}` : null
      }
    });

    return Promise.resolve({
      result: 1,
      code: !isEmptyObject(omit(requestQuery, 'item_per_page')) ? 'RESULT_FOUND' : undefined,
      paginationResult
    });
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
}

function isEmptyObject(o) {
  return Object.keys(o).every(function(x) {
      return o[x]==='' || o[x]===null;  // or just "return o[x];" for falsy values
  });
}