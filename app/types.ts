export type Message = {
  uid: string;
  id?: number;
  msg?: string;
  lastSeenId?: number;
  self?: boolean;
  seen?: boolean;
  system?: boolean;
  time?: number;
};

export type DisplayMessage =
  & Omit<Message, "msg">
  & Required<Pick<Message, "msg">>;
