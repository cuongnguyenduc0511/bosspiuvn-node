const { RECORD_PER_PAGE, RESPONSE } = require('../constant');
const _ = require('lodash');
const queryString = require('querystring');

module.exports.getData = (req, res, modelInstance, callback) => {
	const pageParam = req.query.page;
	const currentPage = (isNaN(parseInt(pageParam)) || pageParam <= 0 || !pageParam) ? 1 : parseInt(pageParam);
	const self = this;

	getPaginationData(req, res, currentPage, modelInstance).then(data => {
		if (!data) {
			self.getData(req, res, modelInstance, callback);
		} else {
			console.log(data);
			callback(null, data);
		}
	}).catch(err => {
		console.log(err);
		callback(err, null);
	});

}

async function getPaginationData(req, res, currentPage, modelInstance) {
	let indexPage = (currentPage - 1) > 0 ? (currentPage - 1) : 0;
	let skip = RECORD_PER_PAGE * indexPage;

	// Clone query obj
	let requestQuery = _.cloneDeep(req.query);
	const dbQuery = modelInstance.searchQuery(req);

	try {
		let paginationResult = await modelInstance.getPaginationData(RECORD_PER_PAGE, skip, dbQuery);
		paginationResult = paginationResult[0];
		if (!paginationResult) {
			// res.send({
			// 	message: RESPONSE.NO_RESULT
			// });
			let countItems = await modelInstance.countAllItems();
			throw ({
				status: 404,
				isPristine: countItems === 0,
				message: RESPONSE.NO_RESULT
			})
		}

		const { totalItems } = paginationResult;
		let totalPages, prevPage, nextPage;
		totalPages = Math.ceil(totalItems / RECORD_PER_PAGE);
		paginationResult.totalPages = totalPages;

		if (currentPage > totalPages) {
			req.query.page = totalPages;
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
		Object.assign(paginationResult, {
			currentPage,
			query: {
				params: requestQuery,
				searchString: !_.isEmpty(requestQuery) ? `?${queryString.stringify(requestQuery)}` : null
			}
		});

		return Promise.resolve(paginationResult);
	} catch (err) {
		return Promise.reject(err);
	}
}