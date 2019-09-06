import * as Yup from 'yup';
import { Op } from 'sequelize';

import Meetapp from '../models/meetapp';
import Subscription from '../models/subscription';
import File from '../models/file';

class SubscriptionController {
  /**
   * Create
   */
  async store(req, res) {
    const schema = Yup.object().shape({
      meetapp_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const meetapp = await Meetapp.findByPk(req.body.meetapp_id);
    // O usuário deve poder se inscrever em meetups que não organiza
    if (meetapp.user_id === req.userId) {
      return res
        .status(401)
        .json({ error: 'You can´t subscribe your own meetapp' });
    }
    // O usuário não pode se inscrever em meetups que já aconteceram.
    if (meetapp.past) {
      return res
        .status(401)
        .json({ error: 'You can´t subscribe a past meetapp' });
    }
    // O usuário não pode se inscrever no mesmo meetup duas vezes.
    const checkAlready = await Subscription.findOne({
      where: {
        meetapp_id: req.body.meetapp_id,
        user_id: req.userId,
      },
    });
    if (checkAlready) {
      return res
        .status(401)
        .json({ error: 'You can´t subscribe this meetapp again' });
    }
    // O usuário não pode se inscrever em dois meetups que acontecem no mesmo horário.
    const checkHour = await Subscription.findOne({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetapp,
          as: 'meetapp',
          required: true,
          where: {
            date: meetapp.date,
          },
        },
      ],
    });
    if (checkHour) {
      return res
        .status(401)
        .json({ error: 'You can´t subscribe any meetapp at this date/time' });
    }

    const subscription = await Subscription.create({
      meetapp_id: req.body.meetapp_id,
      user_id: req.userId,
    });

    // Sempre que um usuário se inscrever no meetup, envie um e-mail ao organizador contendo os dados relacionados ao usuário inscrito. O template do e-mail fica por sua conta :)
    return res.json(subscription);
  }

  /**
   * index
   */
  async index(req, res) {
    const subscription = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetapp,
          as: 'meetapp',
          attributes: ['id', 'name', 'description', 'location', 'date'],
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          include: [
            {
              model: File,
              as: 'banner',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });
    return res.json(subscription);
  }
}

export default new SubscriptionController();
