const {union} = require('lodash');

const DB = {
    REQUEST: 'requests',
    STEPCHART_TYPE: 'stepchart_types',
    SONG: 'songs',
    STATUS: 'status'
}

const FETCH_DATA_MODE = {
    VIEW: 'view',
    DETAILS: 'details',
    PAGINATION: 'pagination'
}

const DEFAULT_WHITE_LIST_EMAILS = [
    'bosspiuvn.official@gmail.com'
]

const STEPCHART_TYPES = {
    SINGLE: 'single',
    DOUBLE: 'double',
    SINGLE_PERFORMANCE: 'single-performance',
    DOUBLE_PERFORMANCE: 'double-performance',
    COOP: 'co-op'
}

const STANDARD_STEPCHART_LEVELS = ['13','14','15','16','17','18','19','20','21','22','23','24','25','26'];
const COOP_STEPCHART_TYPES = ['X2','X3','X4','X5','X6','X7','X8','X9'];

const STANDARD_STEPCHART_REQUIREMENT = [
    STEPCHART_TYPES.SINGLE,
    STEPCHART_TYPES.DOUBLE,
    STEPCHART_TYPES.SINGLE_PERFORMANCE,
    STEPCHART_TYPES.DOUBLE_PERFORMANCE
]

const STEPCHART_LEVELS = union(STANDARD_STEPCHART_LEVELS, COOP_STEPCHART_TYPES);

const UPDATE_MODE = {
    UPDATE: 'Update',
    DELETE: 'Delete'
}

const REQUEST_STATUS = {
    ACTIVATION_PENDING: 'activation-pending',
    PENDING: 'pending',
    COMPLETED: 'completed',
    OFFSYNC: 'offsync',
    UNPLAYABLE: 'unplayable',
    INVALID: 'invalid',
    CRASHED: 'crashed',
    UPLOAD_PENDING: 'upload-pending'
}

const ERROR_STATUS_TYPES = [
    REQUEST_STATUS.OFFSYNC,
    REQUEST_STATUS.UNPLAYABLE,
    REQUEST_STATUS.INVALID,
    REQUEST_STATUS.CRASHED
]

const TOKEN_DURATION_HOURS = 3;

const EXPIRATION_DURATION_DAYS = 7;

const SALT_ROUNDS = 10;

const RECORD_PER_PAGE = 15;

const ID_LENGTH = 20;

const JWT_ID_LENGTH = 100;

const TITLE_FORMAT = '| BOSS_PIUVN Pump It Up Team';

const SORT_TYPE = {
    ASCENDING: 1,
    DESCENDING: -1
}

const RESPONSE = {
    NO_RESULT: 'No Result'
}

const STATUS_CODE = {
    SERVER_ERROR: 500,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    SUCCESS: 200
}

module.exports = {
    DB,
    RECORD_PER_PAGE,
    TITLE_FORMAT,
    SORT_TYPE,
    UPDATE_MODE,
    STATUS_CODE,
    RESPONSE,
    SALT_ROUNDS,
    TOKEN_DURATION_HOURS,
    EXPIRATION_DURATION_DAYS,
    REQUEST_STATUS,
    ID_LENGTH,
    ERROR_STATUS_TYPES,
    JWT_ID_LENGTH,
    STEPCHART_TYPES,
    STEPCHART_LEVELS,
    STANDARD_STEPCHART_REQUIREMENT,
    COOP_STEPCHART_TYPES,
    STANDARD_STEPCHART_LEVELS,
    DEFAULT_WHITE_LIST_EMAILS,
    FETCH_DATA_MODE
};

