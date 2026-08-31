import { Request, Response } from 'express';
import { Book, Publisher, Class, Subject } from '../models';
import { BookStatus } from '../types/enums';

export const bookController = {
  async getAllBooks(req: Request, res: Response) {
    try {
      const books = await Book.findAll({
        include: [
          { model: Publisher, as: 'publisher' },
          { model: Class, as: 'class' },
          { model: Subject, as: 'subject' }
        ]
      });
      res.json(books);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async createBook(req: Request, res: Response) {
    try {
      const book = await Book.create(req.body);
      res.status(201).json(book);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getBook(req: Request, res: Response) {
    try {
      const book = await Book.findByPk(req.params.id, {
        include: ['publisher', 'class', 'subject']
      });
      if (!book) return res.status(404).json({ error: 'Book not found' });
      res.json(book);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateBook(req: Request, res: Response) {
    try {
      const book = await Book.findByPk(req.params.id);
      if (!book) return res.status(404).json({ error: 'Book not found' });
      await book.update(req.body);
      res.json(book);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async toggleBookStatus(req: Request, res: Response) {
    try {
      const book = await Book.findByPk(req.params.id);
      if (!book) return res.status(404).json({ error: 'Book not found' });
      const newStatus = book.status === BookStatus.ACTIVE ? BookStatus.INACTIVE : BookStatus.ACTIVE;
      await book.update({ status: newStatus });
      res.json(book);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
