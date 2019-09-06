import * as Yup from 'yup';
import {
  startOfHour,
  parseISO,
  isBefore,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Op } from 'sequelize';

import Meetapp from '../models/meetapp';
import File from '../models/file';
import User from '../models/user';

class MeetappController {
  /**
   * Delete
   */
  async delete(req, res) {
    const meetapp = await Meetapp.findByPk(req.params.id);
    if (!meetapp) {
      return res.status(401).json({ error: 'Invalid meetapp id!' });
    }

    if (meetapp.user_id !== req.userId) {
      return res
        .status(401)
        .json({ error: 'Not authorized to exclude meetapp from another user' });
    }

    if (meetapp.past) {
      return res.status(401).json({ error: "Can't delete past meetups." });
    }

    await meetapp.destroy();

    return res.send();
  }

  /**
   * Index Date
   */
  async indexDate(req, res) {
    try {
      const { date, page = 1 } = req.query;
      const parsedDate = parseISO(date);

      const meetapp = await Meetapp.findAll({
        where: {
          date: {
            [Op.gte]: startOfDay(parsedDate),
          },
          [Op.and]: {
            date: {
              [Op.lte]: endOfDay(parsedDate),
            },
          },
        },
        oder: ['date'],
        attributes: ['id', 'date', 'name', 'description', 'location'],
        offset: (page - 1) * 10,
        limit: 10,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: File,
            as: 'banner',
            attributes: ['id', 'path', 'url'],
          },
        ],
      });
      return res.json(meetapp);
    } catch (err) {
      return res.status(400).json(`Invalid date or date not find: ${err}`);
    }
  }

  /**
   * Index All
   */
  async index(req, res) {
    try {
      // const { date } = req.query;
      // const parsedDate = parseISO(date);

      const meetapp = await Meetapp.findAll({
        where: {
          user_id: req.userId,
          /**
           * date: {
            [Op.gte]: startOfDay(parsedDate),
          }, */
        },
      });
      return res.json(meetapp);
    } catch (err) {
      return res.status(400).json(`Invalid date or date not find: ${err}`);
    }
  }

  /**
   * Store
   */
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    /**
     * Check for past date
     */
    const { name, description, location, date, banner_id } = req.body;

    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past date are not permitted' });
    }

    /**
     * Check if banner_id exist
     */
    const checkBannerId = await File.findOne({
      where: { id: banner_id },
    });

    if (!checkBannerId) {
      return res.status(401).json({ error: 'Invalid banner_id!' });
    }

    /**
     * Create Meetapp
     */
    const meetapp = await Meetapp.create({
      user_id: req.userId,
      name,
      description,
      location,
      date,
      banner_id,
    });

    return res.json(meetapp);
  }

  /**
   * Update
   */
  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    /**
     * Check if Meetapp exists
     */
    const { id, date: date2, banner_id } = req.body;
    const meetapp = await Meetapp.findByPk(id);
    if (!meetapp) {
      return res.status(400).json({ error: 'Meetapp does not exists.' });
    }
    /**
     * Check if user_id is the same of Meetapp creator
     */

    if (meetapp.user_id !== req.userId) {
      return res
        .status(400)
        .json({ error: 'Meetapp creator does not match with user_id.' });
    }

    /**
     * Check for past date
     */
    const hourStart = startOfHour(parseISO(date2));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past date are not permitted' });
    }

    /**
     * Check if banner_id exist
     */
    const checkBannerId = await File.findOne({
      where: { id: banner_id },
    });

    if (!checkBannerId) {
      return res.status(401).json({ error: 'Invalid banner_id!' });
    }

    /**
     * Update Meetapp
     */
    const { date, name, description, location } = await meetapp.update(
      req.body
    );

    return res.json({
      date,
      name,
      description,
      location,
    });
  }
}

export default new MeetappController();
