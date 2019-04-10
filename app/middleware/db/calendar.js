const calendarDbMiddleware = store => next => action => {
  if(action.type === 'BEGIN_STORE_CALENDAR') {
    storeEvents(action.payload).then((resp) => {
      next({
        type: SUCCESS_STORE_CALENDAR,
        payload: resp
      })
    }, (error) {
      console.log(error);
    })
  }
  return next(action);
}

export default calendarDbMiddleware;
