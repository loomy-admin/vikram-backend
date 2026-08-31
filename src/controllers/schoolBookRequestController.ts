import { Request, Response } from 'express';
import { SchoolBookRequest, School, Book, Publisher } from '../models';

export const schoolBookRequestController = {
  async getAllRequests(req: Request, res: Response) {
    try {
      const requests = await SchoolBookRequest.findAll({
        include: ['school', 'book', 'publisher']
      });
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async createRequest(req: Request, res: Response) {
    try {
      // Typically a school admin calls this
      const request = await SchoolBookRequest.create(req.body);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async updateRequestStatus(req: Request, res: Response) {
    try {
      const { status, publisherId } = req.body;
      const request = await SchoolBookRequest.findByPk(req.params.id);
      if (!request) return res.status(404).json({ error: 'Request not found' });
      
      const updateData: any = { status };
      if (publisherId) updateData.publisherId = publisherId;
      
      await request.update(updateData);
      res.json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};
