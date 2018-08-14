/** @format */

/**
 * External dependencies
 */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import page from 'page';
import QRCode from 'qrcode.react';

/**
 * Internal dependencies
 */
import { localize, translate } from 'i18n-calypso';
import { errorNotice } from 'state/notices/actions';
import getOrderTransaction from 'state/selectors/get-order-transaction';
import getOrderTransactionError from 'state/selectors/get-order-transaction-error';
import { ORDER_TRANSACTION_STATUS } from 'state/order-transactions/constants';
import QueryOrderTransaction from 'components/data/query-order-transaction';
import Spinner from 'components/spinner';

export class WechatPaymentQRCode extends PureComponent {
	static propTypes = {
		orderId: PropTypes.number.isRequired,
		redirectUrl: PropTypes.string.isRequired,
		cart: PropTypes.object.isRequired,
		slug: PropTypes.string,

		// Redux
		showErrorNotice: PropTypes.func,
		transactionReceiptId: PropTypes.number,
		transactionStatus: PropTypes.string,
		transactionError: PropTypes.object,
	};

	componentDidUpdate() {
		const {
			slug,
			showErrorNotice,
			transactionError,
			transactionStatus,
			transactionReceiptId
		} = this.props;

		// HTTP errors + Transaction errors
		if ( transactionError ||
			transactionStatus === ORDER_TRANSACTION_STATUS.ERROR ||
			transactionStatus === ORDER_TRANSACTION_STATUS.FAILURE
		 ) {
			page( slug ? `/checkout/${ slug }` : '/plans');

			// tofix: not reachable, page(path) doesn't exec until after notice is shown wiping the notice from view almost instantly
			// https://www.npmjs.com/package/page doesn't seem to have any callback maybe settimeout?
			showErrorNotice( translate( "Sorry, we couldn't process your payment. Please try again later." ) );

			return;
		}

		if (transactionStatus === ORDER_TRANSACTION_STATUS.UNKNOWN ) {
			// Redirect users back to the plan page so that they won't be stuck here.
			page( slug ? `/plans/my-plan/${ slug }` : '/plans' );

			showErrorNotice( translate( 'Oops! Something went wrong. Please try again later.' ) );

			return;
		}

		if ( transactionStatus === ORDER_TRANSACTION_STATUS.SUCCESS ) {
			if ( transactionReceiptId ) {
				page( slug ? `/checkout/thank-you/${ slug }/${ transactionReceiptId }` : '/checkout/thank-you/no-site' /* no-site + receiptId errors */ );
			} else {
				page( slug ? `/checkout/thank-you/${ slug }` : '/checkout/thank-you/no-site' );
			}

			return;
		}
	}

	render() {
		return <React.Fragment>
			<QueryOrderTransaction orderId={ this.props.orderId } pollIntervalMs={ 1000 } />

			<p className="checkout__wechat-qrcode-instruction">
				{ translate( 'Please scan the barcode using the WeChat Pay application to confirm your %(price)s payment.', {
					args: { price: this.props.cart.total_cost_display },
					comment: 'Instruction to scan a QR barcode and finalize payment with WeChat Pay.',
				} )	}
			</p>

			<div className="checkout__wechat-qrcode">
				<QRCode value={ this.props.redirectUrl } />
			</div>

			<Spinner className="checkout__wechat-qrcode-spinner" size={ 30 }/>

			<p className="checkout__wechat-qrcode-redirect">
				{ translate( 'On mobile? To open and pay with the WeChat Pay app directly, {{a}}click here{{/a}}.', {
					components: { a: <a href={ this.props.redirectUrl } /> },
					comment: 'Asking if mobile detection has failed and they would like to open and be redirected directly into the WeChat app in order to pay.'
				} ) }
			</p>
		</React.Fragment>
	}
}

export default connect(
	( storeState, ownProps ) =>  {
		const { receiptId, processingStatus } = getOrderTransaction( storeState, ownProps.orderId ) || {};
		const transactionError = getOrderTransactionError( storeState, ownProps.orderId );

		return {
			transactionReceiptId: receiptId,
			transactionStatus: processingStatus,
			transactionError: transactionError,
		};
	},
	{
		showErrorNotice: errorNotice,
	}
)( localize ( WechatPaymentQRCode ) );
