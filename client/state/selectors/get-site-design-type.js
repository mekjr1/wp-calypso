/** @format */

/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { getSite } from 'state/sites/selectors';

/**
 * @param {Object} state Global state tree
 * @param {Number} siteIdOrSlug Site ID
 * @return {String} The design type of the site
 */
export default function getSiteDesignType( state, siteIdOrSlug ) {
	if ( ! siteIdOrSlug ) {
		return null;
	}

	const site = getSite( state, siteIdOrSlug );
	if ( ! site ) {
		return null;
	}

	return get( site, 'options.design_type', '' );
}
