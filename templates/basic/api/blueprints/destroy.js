/**
 * Module dependencies
 */
var util = require( 'util' ),
  actionUtil = require( './_util/actionUtil' );

/**
 * Destroy One Record
 *
 * delete  /:modelIdentity/:id
 *    *    /:modelIdentity/destroy/:id
 *
 * Destroys the single model instance with the specified `id` from
 * the data adapter for the given model if it exists.
 *
 * Required:
 * @param {Integer|String} id  - the unique id of the particular instance you'd like to delete
 *
 * Optional:
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */
module.exports = function destroyOneRecord( req, res ) {

  var Model = actionUtil.parseModel( req );
  var pk = actionUtil.requirePk( req );

  if(Model.identity === "company"){
    if(pk !== req.user[0].id){
      res.serverError( 'Stop Fucking Around!' );
    }
  }else{
    pk = {
      id:pk,
      company : req.user[0].id
    }
  }

  var query = Model.findOne( pk );
  query = actionUtil.populateEach( query, req );
  query.exec( function foundRecord( err, record ) {
    if ( err ) return res.serverError( err );
    if ( !record ) return res.notFound( 'No record found with the specified `id`.' );

    Model.destroy( pk.id ).exec( function destroyedRecord( err ) {
      if ( err ) return res.negotiate( err );

      if ( sails.hooks.pubsub ) {
        Model.publishDestroy( pk.id, !sails.config.blueprints.mirror && req, {
          previous: record
        } );
        if ( req.isSocket ) {
          Model.unsubscribe( req, record );
          Model.retire( record );
        }
      }

      return res.ok( null ); // Ember Data REST Adapter expects NULL after DELETE
    } );
  } );
};
