const express = require('express');
const logger = require('morgan');
const axios = require('axios');

const app = express();

app.use(logger('dev'));

/**
 * @function prepareDataByPage Асинхронно загружает каждую страницу API
 * @param params
 *
 * @returns string[] возвращает массив с названием вакансии
 */
const prepareDataByPage = async (params) => {
    const api = 'https://api.hh.ru/vacancies';
    const response = await axios.get(api,{params});
    return response.data.items.map(item => item.name);
};

/**
 * @function groupBY группирует объект по полю, если данные расширятся до массива объектов надо будет использовать
 * @param objectArray
 * @param properties
 * @returns {unknown[]}
 */
const groupBy = (objectArray, ...properties) => {
    return [...Object.values(objectArray.reduce((accumulator, object) => {
        const key = JSON.stringify(properties.map((x) => object[x] || null));

        if (!accumulator[key]) {
            accumulator[key] = [];
        }
        accumulator[key].push(object);
        return accumulator;
    }, {}))];
};

/**
 * @function countOccurrences подсчитывает количество уникальных вхождений
 * @param array
 * @returns {Array<{name:count}>} возвращает массив из пары название:количество
 */
const countOccurrences = (array) => {
    const result = {};
    if (array instanceof Array) {
        array.forEach(function (v, i) {
            if (!result[v]) {
                result[v] = [i];
            } else {
                result[v].push(i);
            }
        });
        Object.keys(result).forEach(function (v) {
            result[v] = result[v].length;
        });
    }
    return result;
};

app.get('/:date', async (req,res) => {

    /**
     * @const date_from левое ограничение диапазона даты публикации ваканскии в формате ISO 8601 - YYYY-MM-DD
     * @type {string}
     */
    const date_from = req.params.date;

    /**
     * @const date_to правое ограничение диапазона даты публикации ваканскии в формате ISO 8601 - YYYY-MM-DD
     * изначально совпадает с левым (т.е. получаем то что было опубликовано в 1 день), если ограничение не нужно, то
     * следует удалить переменную
     * @type {string}
     */
    const date_to = req.params.date;
    /**
     * количество вакансий на страницу, макс. 100
     * @type {number}
     */
    const per_page = 100;

    const data = [];
    for(let page = 1; page <= 19; page++) {
        try {
            const arr = await prepareDataByPage({date_from, date_to, per_page, page});
            await data.push(...arr);
        } catch (e) {
            console.log(e)
        }
    }
    await res.json({data:countOccurrences(data)});
});

module.exports = app;
