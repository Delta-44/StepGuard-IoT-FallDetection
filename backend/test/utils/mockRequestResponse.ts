export function mockRequest(data: any = {}) {
  return { body: data.body || {}, params: data.params || {}, query: data.query || {}, headers: data.headers || {} } as any;
}

export function mockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res as any;
}
