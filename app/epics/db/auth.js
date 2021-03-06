import { mergeMap, catchError } from 'rxjs/operators';
import { ofType } from 'redux-observable';
import { from, of } from 'rxjs';
import { successStoreAuth } from '../../actions/db/auth';
import { retrieveStoreEvents } from '../../actions/db/events';
import getDb from '../../db';
import * as AuthActionTypes from '../../actions/auth';
import * as Providers from '../../utils/constants';

export const storeGoogleAuthEpic = (action$) =>
  action$.pipe(
    ofType(AuthActionTypes.SUCCESS_GOOGLE_AUTH),
    mergeMap((action) =>
      from(storeUser(action.payload.user)).pipe(
        mergeMap((resp) =>
          of(successStoreAuth(), retrieveStoreEvents(Providers.GOOGLE, action.payload.user))
        ),
        catchError((error) => {
          of(console.log(error));
        })
      )
    )
  );

export const storeOutLookAuthEpic = (action$) =>
  action$.pipe(
    ofType(AuthActionTypes.SUCCESS_OUTLOOK_AUTH),
    mergeMap((action) =>
      from(storeUser(action.payload.user)).pipe(
        mergeMap((resp) =>
          of(successStoreAuth(), retrieveStoreEvents(Providers.OUTLOOK, action.payload.user))
        ),
        catchError((error) => {
          of(console.log(error));
        })
      )
    )
  );

export const storeExchangeAuthEpic = (action$) =>
  action$.pipe(
    ofType(AuthActionTypes.SUCCESS_EXCHANGE_AUTH),
    mergeMap((action) =>
      from(storeUser(action.payload.user)).pipe(
        mergeMap((resp) =>
          of(successStoreAuth(), retrieveStoreEvents(Providers.EXCHANGE, action.payload.user))
        ),
        catchError((error) => {
          of(console.log(error));
        })
      )
    )
  );

const storeUser = async (user) => {
  const db = await getDb();
  let userDb = '';
  try {
    userDb = await db.persons.upsert(user);
  } catch (e) {
    console.log('Store User err: ', e);
    return e;
  }

  return userDb;
};
