export type Book = {
  id: string;
  title: string;
  author: string[];
  pages?: number;
  cover?: string;
  rating?: number | null;
  finishedAt?: string | null;
  subjects?: string[];
};

export type PartialBook = {
  title: string;
  author: string[];
  subjects?: string[];
  cover?: string;
  pages?: number;
};

export type YearStats = {
  year: string;
  totalBooks: number;
  totalPages: number;
  topGenre: string | null;
  topAuthor: string | null;
  topBooks: Book[];
};

export type CardData = {
  title: string;
  subtitle: string | React.ReactElement;
  icon: string;
};

export type WrappedCardProps = {
  icon: string;
  title: string;
  subtitle: string | React.ReactElement;
  color: string;
};

export type TotalPagesMessageProps = {
  title: string
  highlight: string
  subtitle: string
}

export type TotalPagesCardProps = {
  totalPages: number;
};
