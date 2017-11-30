const { each } = require('async');
const connection = require('../config/db-connection');

const DynamicQuery = { };
/**
 * @param collection => The collection that it will have a new relation included for each of its elements
 * @param tableToRelate => Table name to get the relation
 * @param collectionColumnToRelate => Column name of @collections to relate
 * @param tableToRelateColumn => Column name of @tableToRelate to relate
 * @param newRelationName => Name of the new realtion
 * @param next => Callback
 * 
 * Given a table, set a relation to a collection
 */
DynamicQuery.addRelation = (collection, tableToRelate, collectionColumnToRelate, tableToRelateColumn, newRelationName, next) => {
    if ( !connection )
        return next('Connection refused');
    each( collection, (item, nextIteration) => {
        connection.query(`SELECT * FROM ?? WHERE ?? = ?`,
        [tableToRelate, tableToRelateColumn, item[collectionColumnToRelate]], (error, result) => {
            if ( error ) {
                nextIteration(error);
            }
            else {
                item[newRelationName] = result;
                nextIteration();
            }
        })
    },
    err => {
        if (err) 
            return next(err);
        else
            return next(null, collection)
    })
}

module.exports = DynamicQuery;