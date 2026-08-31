import { Request, Response } from 'express';
import { Publisher } from '../models';
import { PublisherStatus } from '../types/enums';

export const publisherController = {
  async getAllPublishers(req: Request, res: Response) {
    try {
      const publishers = await Publisher.findAll();
      res.json(publishers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async createPublisher(req: Request, res: Response) {
    try {
      const publisher = await Publisher.create(req.body);
      res.status(201).json(publisher);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getPublisher(req: Request, res: Response) {
    try {
      const publisher = await Publisher.findByPk(req.params.id);
      if (!publisher) return res.status(404).json({ error: 'Publisher not found' });
      res.json(publisher);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updatePublisher(req: Request, res: Response) {
    try {
      const publisher = await Publisher.findByPk(req.params.id);
      if (!publisher) return res.status(404).json({ error: 'Publisher not found' });
      await publisher.update(req.body);
      res.json(publisher);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async togglePublisherStatus(req: Request, res: Response) {
    try {
      const publisher = await Publisher.findByPk(req.params.id);
      if (!publisher) return res.status(404).json({ error: 'Publisher not found' });
      const newStatus = publisher.status === PublisherStatus.ACTIVE ? PublisherStatus.INACTIVE : PublisherStatus.ACTIVE;
      await publisher.update({ status: newStatus });
      res.json(publisher);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};
