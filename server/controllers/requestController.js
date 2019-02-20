const requestModel = require('../models/request');
const pagination = require('../shared/modules/pagination');
const { UPDATE_MODE, STATUS_CODE, REQUEST_STATUS, TOKEN_DURATION_DAY } = require('../shared/constant');
const tokenModule = require('../modules/tokenModules');
const { decodeAndSanitizeObject } = require('../shared/modules/sanitize')
const nodemailer = require('nodemailer');
const hbsNodemailer = require('nodemailer-express-handlebars');
const _ = require('lodash');
const moment = require('moment');

const nodemailerTransport = nodemailer.createTransport({
	host: process.env.MAIL_SERVICE_HOST,
    port: process.env.MAIL_SERVICE_HOST_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

const nodemailerOptions = {
    viewEngine: {
        extname: '.hbs',
        layoutsDir: 'views/email/',
        defaultLayout: 'email_default',
        // partialsDir : 'views/partials/'
    },
    viewPath: 'views/email/',
    extName: '.hbs'
};

nodemailerTransport.use('compile', hbsNodemailer(nodemailerOptions));

module.exports.getItemById = (req, res) => {
	const requestId = req.params.id;
	try {
		requestModel.getItemById(requestId, (err, result) => {
			let requestItem = result[0];
			if (err) {
				res.status(500).send(err);
			} else {
				const statusCode = _.isEmpty(requestItem) ? 404 : 200;
				const notFound = {
					message: 'Request item not found',
					status: 404
				}
				requestItem = _.isEmpty(requestItem) ? notFound : requestItem
				res.status(statusCode).send(requestItem);
			}
		});
	} catch (err) {
		res.status(500).send(err);
	}
};

module.exports.getRequests = (req, res) => {
	try {
		pagination.getData(req, res, requestModel, (err, data) => {
			if (err) {
				// res.status(500).send(err);
				const errorStatus = err.status || 500;
				res.status(errorStatus).send(err);
			} else {
				// res.send(data);
				let statusCode = data.items && data.items.length > 0 ? 200 : 404;
				res.status(statusCode).send(data);
			}
		})
	} catch (err) {
		res.status(500).send(err);
	}
};

module.exports.requestToken = async (req, res) => {
	const { email, mode, requestId } = req.body;
	const { getItemByIdAsync } = requestModel;
	try {
		if (_.isEmpty(requestId)) {
			res.status(STATUS_CODE.BAD_REQUEST).send({
				message: 'Request ID Required'
			});
			return;
		}
		const requestItemResult = await getItemByIdAsync(requestId);
		if (requestItemResult.length > 0) {
			const requestItem = requestItemResult[0];
			const { generateToken, addTokenExpirationTime } = tokenModule;
			const tokenPayload = {
				token: generateToken(),
				exp: addTokenExpirationTime(Date.now(), TOKEN_DURATION_DAY)
			}

			if (email === requestItem.email) {
				sendTokenEmail(requestItem, mode, tokenPayload, res);
			} else {
				res.status(STATUS_CODE.BAD_REQUEST).send({
					message: `Wrong email, please type your valid email`
				});
			}
		} else {
			res.status(STATUS_CODE.NOT_FOUND).send({
				message: 'Request Id Not Found'
			})
		}
		// getItemById(requestId, async (err, result) => {
		// 	const requestItem = result[0];
		// 	if (err) {
		// 		res.status(STATUS_CODE.SERVER_ERROR).send({
		// 			message: err
		// 		});
		// 	} else {
		// 		const { generateToken, addTokenExpirationTime } = tokenModule;
		// 		const tokenPayload = {
		// 			token: generateToken(),
		// 			exp: addTokenExpirationTime(Date.now(), TOKEN_DURATION_DAY)
		// 		}

		// 		if (email === requestItem.email) {
		// 			await sendTokenEmail(requestId, mode, tokenPayload);
		// 			res.status(STATUS_CODE.SUCCESS).send({
		// 				message: `Token has been sent to your email: ${requestItem.email}, Please open your email to get your token`
		// 			})
		// 		} else {
		// 			res.status(STATUS_CODE.BAD_REQUEST).send({
		// 				message: `Wrong email, please type your valid email`
		// 			})
		// 		}
		// 	}
		// });
	} catch (err) {
		console.log(err);
		res.status(STATUS_CODE.SERVER_ERROR).send({
			message: 'An error occurred while requesting token, Please try again later'
		})
	}
}

module.exports.registerNewRequest = (req, res) => {
	try {
		const { defaultData, addData, getItemByIdAsync } = requestModel;
		const { requesterNote, ...rest } = req.body;
		const data = { ...rest };
		decodeAndSanitizeObject(data);
		const {
			stepchartLevel,
			stepchartType,
			song,
			contentName,
			stepmaker,
			requester,
			ucsLink,
			email
		} = data;
		const submitData = {
			stepchartInfo: {
				stepchartType,
				stepchartLevel
			},
			note: {
				requesterNote
			},
			song,
			requester,
			stepmaker,
			contentName,
			ucsLink,
			email
		}
		const newData = _.merge({}, submitData, defaultData);
		addData(newData).then(async addedDoc => {
			try {
				const addedItemResult = await getItemByIdAsync(addedDoc.requestId);
				const addItem = addedItemResult[0];
				await sendRegisterEmail(addItem);
				res.status(STATUS_CODE.SUCCESS).send({
					message: `Your request has been sent, please check your email: ${addItem.email} to confirm your request`
				});
			} catch(err) {
				res.status(STATUS_CODE.SERVER_ERROR).send({
					message: 'An error occurred while registering request, please try again later',
					err
				});
			}
		}).catch(err => {
			const { _message, name } = err;
			res.status(STATUS_CODE.BAD_REQUEST).send({
				message: 'An error occurred while registering request, please try again later',
				err: `${name} - ${_message}`
			});
		})
	} catch (err) {
		res.status(STATUS_CODE.SERVER_ERROR).send({
			message: 'An error occurred while registering request, please try again later',
			err: err.message
		});
	}
}

module.exports.updateRequestByToken = async (req, res) => {
	const { getItemByIdAsync, updateRequestByID, removeToken } = requestModel;
	try {
		const {
			requesterNote,
			...rest
		} = req.body;
		decodeAndSanitizeObject(rest);
		const formData = rest;
		const {
			requestId,
			stepchartType,
			stepchartLevel,
			requester,
			stepmaker,
			ucsLink,
			contentName,
			updateToken
		} = formData;
		if (!requestId) {
			res.status(STATUS_CODE.BAD_REQUEST).send({
				message: 'Request ID Required'
			});
			return;
		}
		const requestItemResult = await getItemByIdAsync(requestId);
		if (requestItemResult.length > 0) {
			const requestItem = requestItemResult[0];
			if (_.isEmpty(requestItem.updateToken)) {
				res.status(STATUS_CODE.BAD_REQUEST).send({
					message: 'Please request update token'
				});
				return;
			}

			if (updateToken === requestItem.updateToken.token) {
				const timeSubmit = new Date();
				if (timeSubmit < requestItem.updateToken.exp) {

					const updateData = {
						stepchartInfo: {
							stepchartType,
							stepchartLevel
						},
						note: {
							requesterNote
						},
						requester,
						stepmaker,
						ucsLink,
						contentName,
						status: REQUEST_STATUS.PENDING
					}

					await removeToken(requestId, UPDATE_MODE.UPDATE);

					updateRequestByID(requestId, updateData, (err) => {
						if (err) {
							res.status(STATUS_CODE.SERVER_ERROR).send(err);
						} else {
							res.status(STATUS_CODE.SUCCESS).send({
								message: 'Congratulations, your request has been successfully updated'
							});
						}
					});
				} else {
					// Remove Update Token
					await removeToken(requestId, UPDATE_MODE.UPDATE);
					res.status(STATUS_CODE.BAD_REQUEST).send({
						message: 'Token has been expired, please request new token'
					});
				}
			} else {
				res.status(STATUS_CODE.BAD_REQUEST).send({
					message: 'Wrong token, please type your valid token'
				});
			}
		} else {
			res.status(STATUS_CODE.NOT_FOUND).send({
				message: 'Request Id Not Found'
			});
		}
	} catch (err) {
		res.status(STATUS_CODE.SERVER_ERROR).send({
			message: 'An error occurred when updating request, Please try again later'
		})
	}
}

module.exports.deleteRequestByToken = async (req, res) => {
	const form = req.body;
	decodeAndSanitizeObject(form);
	const { requestId, email, deleteToken } = form;
	const { getItemByIdAsync, removeToken, deleteRequest } = requestModel;
	try {
		if (_.isEmpty(requestId)) {
			res.status(STATUS_CODE.BAD_REQUEST).send({
				message: 'Request ID Required'
			})
			return;
		}

		const requestItemResult = await getItemByIdAsync(requestId)
		if (requestItemResult.length > 0) {
			const requestItem = requestItemResult[0];
			if (_.isEmpty(requestItem.deleteToken)) {
				res.status(STATUS_CODE.BAD_REQUEST).send({
					message: 'Please request delete token'
				});
				return;
			}

			if (email === requestItem.email && deleteToken === requestItem.deleteToken.token) {
				const timeSubmit = new Date();
				if (timeSubmit < requestItem.deleteToken.exp) {
					// Delete Success
					await deleteRequest(requestId);
					res.status(STATUS_CODE.SUCCESS).send({
						message: 'Congratulations, your request has been successfully deleted'
					});
				} else {
					// Remove Delete Token
					await removeToken(requestId, UPDATE_MODE.DELETE);
					res.status(STATUS_CODE.BAD_REQUEST).send({
						message: 'Token has been expired, please request new token'
					});
				}
			} else {
				res.status(STATUS_CODE.BAD_REQUEST).send({
					message: 'Wrong email / token, please type your valid email / token'
				});
			}
		} else {
			res.status(STATUS_CODE.BAD_REQUEST).send({
				message: 'Request ID Not found'
			})
		}
	} catch (err) {
		res.status(STATUS_CODE.SERVER_ERROR).send({
			message: 'An error occured while deleting request, please try again later',
			err
		})
	}
}

async function sendRegisterEmail(addedRequest) {
	const {
		requestId,
		stepchartInfo,
		song,
		email
	 } = addedRequest;
	const { stepchartLevel, stepchartType } = stepchartInfo;
	
	const title = `[BOSS_PIUVN - UCS Request] - Request ID ${requestId}: ${song.name} ${stepchartType.shortLabel}${(stepchartType.value === 'co-op') ? ` ${stepchartLevel}` : stepchartLevel} has been sent`;
	
	const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: title,
        template: 'register_body',
        context: {
            target: addedRequest
        }
    }

    nodemailerTransport.sendMail(mailOptions);
}

function sendTokenEmail(requestItem, updateMode, tokenPayload, res) {
	let updateData = {};
	const { song, stepchartInfo, email, requestId } = requestItem;
	const { stepchartType, stepchartLevel } = stepchartInfo;
	let mode;
	switch (updateMode) {
		case UPDATE_MODE.UPDATE:
			mode = UPDATE_MODE.UPDATE;
			updateData.updateRequestToken = tokenPayload;
			break;
		case UPDATE_MODE.DELETE:
			mode = UPDATE_MODE.DELETE;
			updateData.deleteRequestToken = tokenPayload;
			break;
	}

	const title = `[BOSS_PIUVN - UCS Request] - ${mode} Token for Request ${song.name} ${stepchartType.shortLabel}${(stepchartType.value === 'co-op') ? ` ${stepchartLevel}` : stepchartLevel}`

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: title,
        template: 'token_body',
        context: {
            target: requestItem,
			tokenPayload,
			mode,
			modeLowercase: mode.toLowerCase()
        }
    }

	requestModel.updateRequestByID(requestId, updateData, async (err, doc) => {
		if (err) {
			res.status(STATUS_CODE.SERVER_ERROR).send(err);
		} else {
			await nodemailerTransport.sendMail(mailOptions);
			res.status(STATUS_CODE.SUCCESS).send({
				message: `Your ${ mode.toLowerCase() } token has been sent to your email: ${ email }, please check your email`
			})
		}
	});
}

// module.exports.updateAll = (req, res) => {
//     requestModel.updateAll(req, res);
// }
