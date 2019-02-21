const DB = {
    REQUEST: 'request',
    STEPCHART_TYPE: 'stepchart_type',
    SONG: 'song',
    STATUS: 'status'
}

const UPDATE_MODE = {
    UPDATE: 'Update',
    DELETE: 'Delete'
}

const REQUEST_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    OFFSYNC: 'offsync',
    UNPLAYABLE: 'unplayable',
    INVALID: 'invalid',
    CRASHED: 'crashed',
    UPLOAD_PENDING: 'upload-pending'
}

const TOKEN_DURATION_DAY = 3;

const SALT_ROUNDS = 10;

const RECORD_PER_PAGE = 15;

const ID_LENGTH = 50;

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
    TOKEN_DURATION_DAY,
    REQUEST_STATUS,
    ID_LENGTH,
    JWT_ID_LENGTH
};

